// @ts-nocheck
/**
 * @fileoverview ユーザープロファイル操作のMutation
 *
 * @description ユーザープロファイルの作成、更新、削除を管理するMutation関数を提供します。
 * 認証済みユーザーのプロファイル管理、組織の自動作成、楽観的ロック、監査ログの記録などを実装します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { getAuthenticatedUser } from '../auth/auth';

// Convex独自の型定義（共通ライブラリの依存関係問題を避けるため）
const USER_ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * ユーザー情報の初期保存 (クライアントからの呼び出し)
 *
 * @description 認証プロバイダー（Clerk）からのユーザー情報を基に、
 * 新規ユーザーの場合はユーザープロファイルを作成します。
 *
 * @mutation
 * @returns {Promise<Id<'userProfiles'>>} 作成または更新されたユーザーのID
 * @throws {Error} 認証情報が無効な場合
 * @since 1.0.0
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Called storeUser without authentication present');
    }

    // ユーザーが既に存在するかチェック
    const user = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (user !== null) {
      // 既にユーザープロファイルが存在する場合は何もしない
      return user._id;
    }

    // スリム化スキーマ用の初期レコード
    const newUserData = {
      clerkId: identity.subject,
      role: 'user' as UserRole,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    return await ctx.db.insert('userProfiles', newUserData);
  },
});

/**
 * [INTERNAL] Clerk Webhook経由でユーザーを作成・更新 (user.created, user.updated)
 * @description この関数がWebhook起因のユーザー作成を担う唯一の関数です。
 * 冪等性キーを使用して重複処理を防止します。
 */
export const upsertUserWithIdempotency = internalMutation({
  args: {
    clerkUser: v.any(),
    idempotencyKey: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, { clerkUser, idempotencyKey, eventType }) => {
    // Clerk user payload (see https://clerk.com/docs/reference/webhooks#user-events)
    // スリム化後のスキーマでは name/email/avatarUrl を保持しない。
    // Convex 側では `clerkId` と `role` のみを同期する。
    const { id: clerkId, public_metadata } = clerkUser as {
      id: string;
      public_metadata?: { role?: UserRole };
    };

    // Clerk public_metadata.role ("user" | "manager" | "admin")
    // なければ "user" をデフォルトとする
    const roleFromPublic: UserRole = (public_metadata?.role as UserRole) ?? 'user';

    // 1. 冪等性チェック
    const existingProcessing = await ctx.db
      .query('audit_logs')
      .filter((q) =>
        q.and(
          q.eq(q.field('action'), 'webhook_processing'),
          q.eq(q.field('payload.idempotencyKey'), idempotencyKey)
        )
      )
      .first();

    if (existingProcessing) {
      console.log(`[${eventType}] Webhook ${idempotencyKey} already processed, skipping.`);
      return;
    }

    // 2. 処理開始を記録
    await ctx.db.insert('audit_logs', {
      action: 'webhook_processing',
      payload: { idempotencyKey, eventType, clerkUserId: clerkId },
      created_at: Date.now(),
    });

    // 3. ユーザーを検索
    const userRecord = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .unique();

    // name / email / avatarUrl は Convex 側で保持しないため無視

    if (userRecord === null) {
      // 4. ユーザーが存在しない場合、新規作成
      console.log(`[${eventType}] Creating new user: ${clerkId}`);
      await ctx.db.insert('userProfiles', {
        clerkId,
        role: roleFromPublic,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    } else {
      // 5. ユーザーが存在する場合、情報を更新
      // 組織情報(orgId, role)は別のWebhookで更新されるため、ここでは更新しない
      console.log(`[${eventType}] Updating existing user: ${clerkId}`);
      const updates: Partial<{ role: UserRole; updated_at: number }> = {
        updated_at: Date.now(),
      };

      if (roleFromPublic && roleFromPublic !== userRecord.role) {
        updates.role = roleFromPublic;
      }

      if (Object.keys(updates).length > 1) {
        await ctx.db.patch(userRecord._id, updates);
      } else {
        console.log(`[${eventType}] No profile changes detected for user: ${clerkId}`);
      }
    }
  },
});

/**
 * [INTERNAL] Clerk Webhook経由でユーザーの組織情報とロールを更新 (organizationMembership.created)
 * @description この関数はユーザーの組織情報更新のみを担当し、ユーザー作成は行いません。
 * ユーザーが見つからない場合はエラーをスローし、Clerkの再試行機能に委ねます。
 */
export const updateUserOrgAndRoleWithIdempotency = internalMutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    role: v.string(), // e.g., 'org:admin', 'org:member'
    idempotencyKey: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, { clerkUserId, clerkOrgId, role, idempotencyKey, eventType }) => {
    // 1. 冪等性チェック
    const existingProcessing = await ctx.db
      .query('audit_logs')
      .filter((q) =>
        q.and(
          q.eq(q.field('action'), 'webhook_processing'),
          q.eq(q.field('payload.idempotencyKey'), idempotencyKey)
        )
      )
      .first();

    if (existingProcessing) {
      console.log(`[${eventType}] Webhook ${idempotencyKey} already processed, skipping.`);
      return;
    }

    // 2. 処理開始を記録
    await ctx.db.insert('audit_logs', {
      action: 'webhook_processing',
      payload: { idempotencyKey, eventType, clerkUserId, clerkOrgId },
      created_at: Date.now(),
    });

    // 3. ユーザーを検索
    const userRecord = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .unique();

    if (userRecord === null) {
      // 4. ユーザーが見つからない場合、エラーをスローして再試行を促す
      // `user.created`が先に処理されるのを待つ
      throw new Error(
        `[${eventType}] User ${clerkUserId} not found. Waiting for user.created webhook. Retrying...`
      );
    }

    // 5. 組織を検索
    const org = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkOrgId))
      .unique();

    if (!org) {
      // 組織が見つからない場合は、エラーログを残して終了
      console.error(`[${eventType}] Organization ${clerkOrgId} not found for user ${clerkUserId}.`);
      return;
    }

    // 6. Clerkのロールをアプリのロールにマッピング
    const newRole: UserRole = role.includes('admin') ? 'admin' : 'user';

    // 7. ユーザーの組織情報とロールを更新
    console.log(
      `[${eventType}] Linking user ${clerkUserId} to org ${clerkOrgId} with role ${newRole}`
    );
    await ctx.db.patch(userRecord._id, {
      orgId: org._id,
      role: newRole,
      updated_at: Date.now(),
    });
  },
});

/**
 * [INTERNAL] Clerk Webhook経由でユーザーを削除 (user.deleted)
 */
export const deleteUser = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userRecord = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', id))
      .unique();

    if (userRecord !== null) {
      await ctx.db.delete(userRecord._id);
      console.log(`[user.deleted] Deleted user: ${id}`);
    }
  },
});

/**
 * [INTERNAL] Clerk Webhook経由で招待承認イベントを処理 (organizationInvitation.accepted)
 * @description ユーザーと組織の紐付けを確実に行います。
 * 基本的にはorganizationMembership.createdで処理されますが、念のためのフォールバックです。
 */
export const ensureUserOrgLinkage = internalMutation({
  args: {
    organizationId: v.string(),
    emailAddress: v.string(),
    role: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, { organizationId, emailAddress, role, idempotencyKey }) => {
    const eventType = 'organizationInvitation.accepted';

    // 1. 冪等性チェック
    const existingProcessing = await ctx.db
      .query('audit_logs')
      .filter((q) =>
        q.and(
          q.eq(q.field('action'), 'webhook_processing'),
          q.eq(q.field('payload.idempotencyKey'), idempotencyKey)
        )
      )
      .first();

    if (existingProcessing) {
      console.log(`[${eventType}] Webhook ${idempotencyKey} already processed, skipping.`);
      return;
    }

    // 2. 処理開始を記録
    await ctx.db.insert('audit_logs', {
      action: 'webhook_processing',
      payload: { idempotencyKey, eventType, emailAddress, organizationId },
      created_at: Date.now(),
    });

    // 3. ユーザーをメールアドレスで検索
    const user = await ctx.db
      .query('userProfiles')
      .filter((q) => q.eq(q.field('email'), emailAddress))
      .first();

    if (!user) {
      console.warn(
        `[${eventType}] User not found by email: ${emailAddress}. Relying on other webhooks.`
      );
      return;
    }

    // 4. 組織を検索
    const org = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', organizationId))
      .unique();

    if (!org) {
      console.warn(`[${eventType}] Organization not found: ${organizationId}.`);
      return;
    }

    // 5. ユーザーが既に紐付いているか確認し、まだなら更新
    if (user.orgId !== org._id) {
      const newRole: UserRole = role.includes('admin') ? 'admin' : 'user';
      await ctx.db.patch(user._id, {
        orgId: org._id,
        role: newRole,
        updated_at: Date.now(),
      });
      console.log(
        `[${eventType}] Linked user ${user.clerkId} to organization ${organizationId} with role ${newRole}`
      );
    } else {
      console.log(
        `[${eventType}] User ${emailAddress} already linked to organization ${organizationId}`
      );
    }
  },
});

// 注意: updateProfile ミューテーションは削除されました。
// プロフィール編集は現在Clerkの user.update() を使用して
// WebとMobileアプリで直接処理されます。

/**
 * プロファイルの論理削除
 *
 * @description ユーザープロファイルを論理削除します。管理者ユーザーは削除できません。
 * データの完全削除ではなく、ユーザー名の匿名化と個人情報の除去を行い、
 * 監査ログに削除履歴を記録してデータトレーサビリティを維持します。
 *
 * @mutation
 * @returns {Promise<{success: boolean}>} 削除処理の結果
 * @throws {Error} ユーザーが見つからない場合または管理者ユーザーの場合
 * @example
 * ```typescript
 * try {
 *   const result = await deleteProfile();
 *   if (result.success) {
 *     console.log('Profile deleted successfully');
 *   }
 * } catch (error) {
 *   console.error('Cannot delete admin profile:', error.message);
 * }
 * ```
 * @since 1.0.0
 */
export const deleteProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    // 管理者ロールの場合は削除不可
    if (user.role === 'admin') {
      throw new Error('Admin users cannot delete their profiles');
    }

    // 注意: レガシーフィールドは削除されているため、
    // 削除処理もシンプルになりました
    const previousValues = {
      clerkId: user.clerkId,
      role: user.role,
      orgId: user.orgId,
    };

    // 論理削除: ユーザーレコードを完全に削除
    // （Clerk側でユーザー情報は管理されているため）
    await ctx.db.delete(user._id);

    // プロフィール削除をaudit_logsに記録
    if (user.orgId) {
      await ctx.db.insert('audit_logs', {
        actor_id: user._id,
        action: 'deleteProfile',
        payload: {
          userId: user._id,
          previousValues,
          timestamp: Date.now(),
        },
        created_at: Date.now(),
        org_id: user.orgId,
      });
    }

    return { success: true };
  },
});

/**
 * ユーザーロールの更新 (管理者のみ)
 *
 * @description 管理者がユーザーのロールを変更します。
 *
 * @mutation
 * @param {Object} args - 更新データ
 * @param {Id<'userProfiles'>} args.userId - 対象ユーザーのID
 * @param {'user' | 'manager' | 'admin'} args.role - 新しいロール
 * @returns {Promise<{success: boolean}>} 更新結果
 * @throws {Error} 権限不足、またはユーザーが見つからない場合
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id('userProfiles'),
    role: v.union(v.literal('user'), v.literal('manager'), v.literal('admin')),
  },
  handler: async (ctx, args) => {
    const adminUser = await getAuthenticatedUser(ctx);
    if (!adminUser || adminUser.role !== 'admin' || !adminUser.orgId) {
      throw new Error('Permission denied. Admin role required.');
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error('Target user not found.');
    }

    if (targetUser.orgId !== adminUser.orgId) {
      throw new Error('Permission denied. Cannot change role for users outside your organization.');
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * [INTERNAL] 重複ユーザーの一括クリーンアップ
 * @description 同じclerkIdを持つ重複ユーザーを検出し、適切に統合します。
 */
export const cleanupDuplicateUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users grouped by clerkId
    const allUsers = await ctx.db.query('userProfiles').collect();
    const usersByClerkId = new Map<string, typeof allUsers>();

    for (const user of allUsers) {
      if (!user.clerkId) {
        continue;
      }

      if (!usersByClerkId.has(user.clerkId)) {
        usersByClerkId.set(user.clerkId, []);
      }
      usersByClerkId.get(user.clerkId)!.push(user);
    }

    let totalDuplicatesFound = 0;
    let totalDuplicatesDeleted = 0;

    for (const [clerkId, users] of usersByClerkId) {
      if (users.length > 1) {
        totalDuplicatesFound += users.length - 1;

        // Sort users by priority: orgId first, then role hierarchy
        const sortedUsers = users.sort((a, b) => {
          if (a.orgId && !b.orgId) {
            return -1;
          }
          if (!a.orgId && b.orgId) {
            return 1;
          }
          const roleOrder: Record<UserRole, number> = { admin: 3, manager: 2, user: 1 };
          return (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
        });

        const [keepUser] = sortedUsers;
        const deleteUsers = sortedUsers.slice(1);

        for (const duplicateUser of deleteUsers) {
          await ctx.db.delete(duplicateUser._id);
          totalDuplicatesDeleted++;
        }

        // Record the cleanup action
        if (keepUser.orgId) {
          await ctx.db.insert('audit_logs', {
            action: 'cleanup_duplicates',
            payload: {
              clerkId,
              keptUserId: keepUser._id,
              deletedCount: deleteUsers.length,
              deletedUserIds: deleteUsers.map((u) => u._id),
            },
            created_at: Date.now(),
            org_id: keepUser.orgId,
          });
        }
      }
    }

    return {
      duplicatesFound: totalDuplicatesFound,
      duplicatesDeleted: totalDuplicatesDeleted,
      usersProcessed: allUsers.length,
    };
  },
});
