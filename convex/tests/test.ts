import { v } from 'convex/values';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { mutation, query } from '../_generated/server';

/**
 * 基本的なテスト用クエリ
 * 認証なしでConvexの動作確認
 */
export const getHealthCheck = query({
  args: {},
  handler: async () => {
    return {
      status: 'OK',
      timestamp: Date.now(),
      message: 'SmartNippo Convex Backend is running',
    };
  },
});

/**
 * 組織一覧を取得（テスト用）
 */
export const listOrgs = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query('orgs').collect();
    return orgs.map((org) => ({
      id: org._id,
      clerkId: org.clerkId,
      name: org.name,
      plan: org.plan,
    }));
  },
});

/**
 * テスト用組織を作成
 */
export const createTestOrg = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    plan: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise'))),
  },
  handler: async (ctx, args) => {
    const orgData: {
      clerkId: string;
      name: string;
      plan: 'free' | 'pro' | 'enterprise';
      created_at: number;
      updated_at: number;
    } = {
      clerkId: args.clerkId,
      name: args.name,
      plan: args.plan ?? 'free',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    return await ctx.db.insert('orgs', orgData);
  },
});

/**
 * テスト用ユーザーを作成
 */
export const createTestUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('user'), v.literal('manager'), v.literal('admin')),
    orgId: v.id('orgs'),
  },
  handler: async (ctx, args) => {
    const userData: {
      clerkId: string;
      name: string;
      email: string;
      role: 'user' | 'manager' | 'admin';
      orgId: Id<'orgs'>;
      created_at: number;
      updated_at: number;
    } = {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      role: args.role,
      orgId: args.orgId,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const userId = await ctx.db.insert('userProfiles', userData);
    return userId;
  },
});

/**
 * ユーザーをIDで取得（テスト用）
 */
export const getUserById = query({
  args: {
    userId: v.id('userProfiles'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * 監査ログを取得（テスト用）
 */
export const getAuditLogs = query({
  args: {
    orgId: v.id('orgs'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('audit_logs')
      .withIndex('by_org', (q) => q.eq('org_id', args.orgId))
      .order('desc')
      .take(args.limit ?? 10);
  },
});

/**
 * テスト用のダミーmutation（監査ログテスト用）
 */
export const testMutation = mutation({
  args: {},
  handler: async () => {
    return { message: 'Test mutation executed successfully', timestamp: Date.now() };
  },
});

export const testAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      identity,
      hasIdentity: !!identity,
    };
  },
});

// ユーザー一覧を取得するクエリ
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('userProfiles').collect();
    return users.map((user) => ({
      id: user._id,
      clerkId: user.clerkId,
      orgId: user.orgId,
      role: user.role,
    }));
  },
});

// 重複ユーザーをクリーンアップするmutation
export const cleanupDuplicateUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('userProfiles').collect();

    // ClerkIDでグループ化
    const userGroups = new Map<string, typeof users>();

    for (const user of users) {
      const { clerkId } = user;
      if (!userGroups.has(clerkId)) {
        userGroups.set(clerkId, []);
      }
      userGroups.get(clerkId)!.push(user);
    }

    const cleanupResults = [];

    // 重複があるユーザーを処理
    for (const [clerkId, duplicateUsers] of userGroups.entries()) {
      if (duplicateUsers.length > 1) {
        console.log(`Found ${duplicateUsers.length} duplicates for clerkId: ${clerkId}`);

        // orgIdを持つユーザーを優先、次にroleが高いユーザーを優先
        const sortedUsers = duplicateUsers.sort((a, b) => {
          // orgIdを持つユーザーを優先
          if (a.orgId && !b.orgId) {
            return -1;
          }
          if (!a.orgId && b.orgId) {
            return 1;
          }

          // roleの優先順位: admin > manager > user
          const roleOrder = { admin: 3, manager: 2, user: 1 };
          const aOrder = roleOrder[a.role] || 0;
          const bOrder = roleOrder[b.role] || 0;

          return bOrder - aOrder;
        });

        const [keepUser] = sortedUsers;
        const deleteUsers = sortedUsers.slice(1);

        cleanupResults.push({
          clerkId,
          kept: {
            id: keepUser._id,
            orgId: keepUser.orgId,
            role: keepUser.role,
          },
          deleted: deleteUsers.map((u) => ({
            id: u._id,
            orgId: u.orgId,
            role: u.role,
          })),
        });

        // 重複ユーザーを削除
        for (const user of deleteUsers) {
          await ctx.db.delete(user._id);
          console.log(`Deleted duplicate user: ${user._id}`);
        }
      }
    }

    return {
      message: `Cleanup completed. Processed ${cleanupResults.length} duplicate groups.`,
      results: cleanupResults,
    };
  },
});

/**
 * 重複ユーザーをクリーンアップ
 */
export const cleanupDuplicates = mutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runMutation(internal.users.mutations.cleanupDuplicateUsers, {});
  },
});

/**
 * audit_logsテーブルの内容を確認
 */
export const listAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query('audit_logs').order('desc').take(20);
    return logs.map((log) => ({
      id: log._id,
      action: log.action,
      actor_id: log.actor_id,
      created_at: new Date(log.created_at).toISOString(),
      payload: log.payload,
    }));
  },
});

/**
 * 特定のユーザーを組織に手動で紐付け
 */
export const linkUserToOrg = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, { clerkUserId, clerkOrgId, role }): Promise<any> => {
    const user = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .unique();

    const org = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkOrgId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${clerkUserId}`);
    }

    if (!org) {
      throw new Error(`Organization not found: ${clerkOrgId}`);
    }

    // Map Clerk role to application role
    const newRole = role === 'org:admin' ? 'admin' : 'user';

    await ctx.db.patch(user._id, {
      orgId: org._id,
      role: newRole,
      updated_at: Date.now(),
    });

    return {
      message: `Successfully linked user ${clerkUserId} to organization ${clerkOrgId} with role ${newRole}`,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        orgId: org._id,
        role: newRole,
      },
    };
  },
});
