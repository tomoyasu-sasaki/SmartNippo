import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthenticatedUser } from './lib/auth';

// ユーザー情報を保存する
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
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    // 既存ユーザーの処理
    if (user !== null) {
      // orgIdがない場合は、新しい組織を作成して割り当てる（データ移行用）
      if (!user.orgId) {
        const orgId = await ctx.db.insert('orgs', {
          name: `${identity.name ?? 'New'}'s Organization`,
          plan: 'free',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        await ctx.db.patch(user._id, {
          orgId,
          role: 'admin', // 最初のユーザーはadmin
          updated_at: Date.now(),
        });
        return user._id;
      }
      return user._id;
    }

    // 新規ユーザーの処理
    // 新しい組織を作成
    const orgId = await ctx.db.insert('orgs', {
      name: `${identity.name ?? 'New User'}'s Organization`,
      plan: 'free',
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // 新規ユーザーをadminとして作成
    const newUserData: any = {
      name: identity.name ?? 'New User',
      tokenIdentifier: identity.tokenIdentifier,
      role: 'admin',
      orgId,
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

// 現在のユーザー情報を取得する
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('userProfiles')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    return user;
  },
});

// プロフィール更新mutation（楽観的ロック対応）
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

// プロフィール削除mutation（論理削除）
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

// プロフィール変更履歴を取得するquery
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
