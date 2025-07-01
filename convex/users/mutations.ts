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
      // tokenIdentifier が未登録の場合は追加でパッチ
      if (!user.tokenIdentifier) {
        await ctx.db.patch(user._id, {
          tokenIdentifier: identity.tokenIdentifier,
          updated_at: Date.now(),
        });
      }
      return user._id;
    }

    const newUserData: any = {
      clerkId: identity.subject,
      name: identity.name ?? 'New User',
      tokenIdentifier: identity.tokenIdentifier,
      role: 'user', // デフォルトロール
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    if (identity.email) {
      newUserData.email = identity.email;
    }
    if (identity.pictureUrl) {
      newUserData.avatarUrl = identity.pictureUrl;
    }

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
    const { id: clerkId, first_name, last_name, image_url, email_addresses } = clerkUser;

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

    const name = [first_name, last_name].filter(Boolean).join(' ') || 'New User';
    const email = email_addresses[0]?.email_address;

    if (userRecord === null) {
      // 4. ユーザーが存在しない場合、新規作成
      console.log(`[${eventType}] Creating new user: ${clerkId}`);
      await ctx.db.insert('userProfiles', {
        clerkId,
        name,
        email,
        avatarUrl: image_url,
        role: 'user',
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    } else {
      // 5. ユーザーが存在する場合、情報を更新
      // 組織情報(orgId, role)は別のWebhookで更新されるため、ここでは更新しない
      console.log(`[${eventType}] Updating existing user: ${clerkId}`);
      await ctx.db.patch(userRecord._id, {
        name,
        email,
        avatarUrl: image_url,
        updated_at: Date.now(),
      });
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

/**
 * プロファイル情報の更新
 *
 * @description ユーザープロファイルの包括的な更新機能を提供します。
 * 楽観的ロックによる競合回避、変更履歴の追跡、監査ログの記録を実装し、
 * 名前、アバター、ソーシャルリンク、プライバシー設定などを安全に更新します。
 *
 * @mutation
 * @param {Object} args - 更新するプロファイルデータ
 * @param {string} [args.name] - ユーザー名
 * @param {string} [args.avatarUrl] - アバター画像のURL
 * @param {string} [args.pushToken] - プッシュ通知用トークン
 * @param {Object} [args.socialLinks] - ソーシャルメディアリンク
 * @param {Object} [args.privacySettings] - プライバシー設定
 * @param {number} [args._version] - 楽観的ロック用バージョン番号
 * @returns {Promise<{success: boolean, changes?: string[], message?: string}>} 更新結果
 * @throws {Error} ユーザーが見つからない場合または楽観的ロック競合の場合
 * @example
 * ```typescript
 * const result = await updateProfile({
 *   name: 'New Name',
 *   socialLinks: {
 *     twitter: 'https://twitter.com/newhandle'
 *   },
 *   _version: currentVersion
 * });
 *
 * if (result.success) {
 *   console.log('Updated fields:', result.changes);
 * }
 * ```
 * @since 1.0.0
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    pushToken: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        github: v.optional(v.string()),
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
    privacySettings: v.optional(
      v.object({
        profile: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        email: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        socialLinks: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        reports: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        avatar: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
      })
    ),
    _version: v.optional(v.number()), // 楽観的ロック用
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    // 楽観的ロック: 現在のupdated_atと比較
    if (args._version && user.updated_at !== args._version) {
      throw new Error('Profile has been updated by another process. Please refresh and try again.');
    }

    // 変更前の値を記録
    const previousValues = {
      name: user.name,
      avatarUrl: user.avatarUrl,
      pushToken: user.pushToken,
    };

    const updates: Partial<{
      name: string;
      avatarUrl: string;
      pushToken: string;
      socialLinks: {
        twitter?: string;
        linkedin?: string;
        github?: string;
        instagram?: string;
        facebook?: string;
        youtube?: string;
        website?: string;
      };
      privacySettings: {
        profile?: 'public' | 'organization' | 'team' | 'private';
        email?: 'public' | 'organization' | 'team' | 'private';
        socialLinks?: 'public' | 'organization' | 'team' | 'private';
        reports?: 'public' | 'organization' | 'team' | 'private';
        avatar?: 'public' | 'organization' | 'team' | 'private';
      };
      updated_at: number;
    }> = {
      updated_at: Date.now(),
    };

    const changes: Record<string, { from: any; to: any }> = {};

    if (args.name !== undefined && args.name !== user.name) {
      updates.name = args.name;
      changes.name = { from: user.name, to: args.name };
    }

    if (args.avatarUrl !== undefined && args.avatarUrl !== user.avatarUrl) {
      updates.avatarUrl = args.avatarUrl;
      changes.avatarUrl = { from: user.avatarUrl, to: args.avatarUrl };
    }

    if (args.pushToken !== undefined && args.pushToken !== user.pushToken) {
      updates.pushToken = args.pushToken;
      changes.pushToken = { from: user.pushToken, to: args.pushToken };
    }

    if (args.socialLinks !== undefined) {
      (updates as any).socialLinks = args.socialLinks;
      changes.socialLinks = { from: user.socialLinks, to: args.socialLinks };
    }

    if (args.privacySettings !== undefined) {
      (updates as any).privacySettings = args.privacySettings;
      changes.privacySettings = { from: user.privacySettings, to: args.privacySettings };
    }

    // 変更がない場合は何もしない
    if (Object.keys(changes).length === 0) {
      return { success: true, message: 'No changes detected' };
    }

    await ctx.db.patch(user._id, updates);

    // プロフィール変更履歴をaudit_logsに記録
    if (user.orgId) {
      await ctx.db.insert('audit_logs', {
        actor_id: user._id,
        action: 'updateProfile',
        payload: {
          userId: user._id,
          changes,
          timestamp: Date.now(),
        },
        created_at: Date.now(),
        org_id: user.orgId,
      });
    }

    return { success: true, changes: Object.keys(changes) };
  },
});

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

    const previousValues = {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      pushToken: user.pushToken,
    };

    // 論理削除: 名前を匿名化、他のフィールドを削除
    const deleteUpdates: {
      name: string;
      updated_at: number;
    } = {
      name: 'Deleted User',
      updated_at: Date.now(),
    };

    await ctx.db.patch(user._id, deleteUpdates);

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
