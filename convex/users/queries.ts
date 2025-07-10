/**
 * @fileoverview ユーザー情報取得クエリ
 *
 * @description ユーザー関連の情報を取得するためのクエリ関数を提供します。
 * 現在のログインユーザー情報の取得、プロファイル変更履歴の取得などの機能を管理します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { action, internalQuery, query } from '../_generated/server';
import { getAuthenticatedUser } from '../auth/auth';

/**
 * [INTERNAL] 特定のユーザープロファイルを取得
 * @param userId ユーザープロファイルID
 * @returns ユーザープロファイル情報
 */
export const getProfile = internalQuery({
  args: {
    userId: v.id('userProfiles'),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/**
 * [INTERNAL] 全ユーザープロファイルを取得（ページネーション付き）
 * @param limit 取得する最大件数
 * @returns ユーザープロファイルの配列
 */
export const getAllProfiles = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query('userProfiles').order('asc').take(limit);
  },
});

/**
 * Clerkのユーザー情報を取得するアクション
 * @param clerkIds ClerkユーザーIDの配列
 * @returns Clerkユーザー情報の配列
 */
export const getClerkUsers = action({
  args: {
    clerkIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Clerk Backend APIを使用してユーザー情報を取得
    // 注: 実際の実装ではclerkClientを使用する必要があります
    // この実装は簡略化されており、実際のAPIコールが必要です
    const users = await Promise.all(
      args.clerkIds.map(async (clerkId) => {
        try {
          // TODO: 実際のClerk Backend API呼び出しを実装
          // const user = await clerkClient.users.getUser(clerkId);
          // return user;
          return {
            id: clerkId,
            fullName: `User ${clerkId.slice(-4)}`, // プレースホルダー
            emailAddresses: [{ emailAddress: `user${clerkId.slice(-4)}@example.com` }],
            imageUrl: null,
          };
        } catch (error) {
          console.error(`Failed to fetch Clerk user ${clerkId}:`, error);
          return null;
        }
      })
    );

    return users.filter(Boolean);
  },
});

/**
 * 現在の認証済みユーザー情報取得
 *
 * @description 現在ログインしているユーザーのプロファイル情報を取得します。
 * 認証トークンを基にユーザーを特定し、プロファイルデータを返します。
 * 未認証の場合は null を返します。
 *
 * @query
 * @returns {Promise<UserProfile|null>} ユーザープロファイル情報または null（未認証時）
 * @example
 * ```typescript
 * const currentUser = await current();
 * if (currentUser) {
 *   console.log('Logged in as:', currentUser.name);
 * } else {
 *   console.log('Not authenticated');
 * }
 * ```
 * @since 1.0.0
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    return user;
  },
});

/**
 * 組織内の全ユーザーを取得する（Clerkユーザー情報付き）
 * @returns {Promise<Array<Doc<'userProfiles'> & { clerkUser?: ClerkUser }>>}
 */
export const listByOrg = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user || !user.orgId) {
      return [];
    }

    const users = await ctx.db
      .query('userProfiles')
      .withIndex('by_org', (q) => q.eq('orgId', user.orgId!))
      .collect();

    // Clerkユーザー情報を取得するため、clerkIdを収集
    const clerkIds = users.map((u) => u.clerkId).filter(Boolean);

    // Clerk情報を取得（実際の実装では外部API呼び出しが必要）
    // 現時点では簡略化された実装
    const clerkUsers = await Promise.all(
      clerkIds.map(async (clerkId) => {
        try {
          // TODO: 実際のClerk Backend API呼び出しを実装
          // const clerkUser = await clerkClient.users.getUser(clerkId);
          // return { clerkId, user: clerkUser };
          return {
            clerkId,
            user: {
              id: clerkId,
              fullName: `User ${clerkId.slice(-4)}`,
              emailAddresses: [{ emailAddress: `user${clerkId.slice(-4)}@example.com` }],
              imageUrl: null,
            },
          };
        } catch (error) {
          console.error(`Failed to fetch Clerk user ${clerkId}:`, error);
          return { clerkId, user: null };
        }
      })
    );

    const clerkUserMap = new Map(clerkUsers.map((item) => [item.clerkId, item.user]));

    // ConvexユーザーとClerkユーザー情報をマージ
    return users.map((user) => ({
      ...user,
      clerkUser: clerkUserMap.get(user.clerkId) ?? null,
    }));
  },
});

/**
 * 組織内の承認者（manager/admin）を取得する
 * @returns {Promise<Array<Doc<'userProfiles'>>>}
 */
export const listApproversByOrg = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user || !user.orgId) {
      return [];
    }

    const managers = await ctx.db
      .query('userProfiles')
      .withIndex('by_org_role', (q) => q.eq('orgId', user.orgId!).eq('role', 'manager'))
      .collect();

    const admins = await ctx.db
      .query('userProfiles')
      .withIndex('by_org_role', (q) => q.eq('orgId', user.orgId!).eq('role', 'admin'))
      .collect();

    return [...managers, ...admins];
  },
});

/**
 * ユーザープロファイル変更履歴取得
 *
 * @description 指定したユーザーのプロファイル変更履歴を監査ログから取得します。
 * 管理者・マネージャーは他のユーザーの履歴も閲覧可能ですが、
 * 一般ユーザーは自分の履歴のみ閲覧できます。
 *
 * @query
 * @param {Object} args - クエリパラメータ
 * @param {Id<'userProfiles'>} [args.userId] - 対象ユーザーID（省略時は現在のユーザー）
 * @param {number} [args.limit=50] - 取得する履歴の最大件数
 * @returns {Promise<AuditLog[]>} プロファイル変更履歴の配列
 * @throws {Error} ユーザーが見つからない場合または権限不足の場合
 * @example
 * ```typescript
 * // 自分の履歴を取得
 * const myHistory = await getProfileHistory();
 *
 * // 特定ユーザーの履歴を取得（管理者のみ）
 * const userHistory = await getProfileHistory({
 *   userId: 'user123',
 *   limit: 20
 * });
 * ```
 * @since 1.0.0
 */
export const getProfileHistory = query({
  args: {
    userId: v.optional(v.id('userProfiles')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    // 管理者または本人のみ履歴を閲覧可能
    const targetUserId = args.userId ?? user._id;
    if (targetUserId !== user._id && user.role !== 'admin' && user.role !== 'manager') {
      throw new Error('Insufficient permissions to view profile history');
    }

    if (!user.orgId) {
      return [];
    }

    const history = await ctx.db
      .query('audit_logs')
      .withIndex('by_org', (q) => q.eq('org_id', user.orgId!))
      .filter((q) =>
        q.and(
          q.eq(q.field('actor_id'), targetUserId),
          q.or(q.eq(q.field('action'), 'updateProfile'), q.eq(q.field('action'), 'deleteProfile'))
        )
      )
      .order('desc')
      .take(args.limit ?? 50);

    return history;
  },
});
