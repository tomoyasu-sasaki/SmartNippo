import { v } from 'convex/values';
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
    return await ctx.db.query('orgs').collect();
  },
});

/**
 * テスト用組織を作成
 */
export const createTestOrg = mutation({
  args: {
    name: v.string(),
    plan: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise'))),
  },
  handler: async (ctx, args) => {
    const orgData: {
      name: string;
      plan: 'free' | 'pro' | 'enterprise';
      created_at: number;
      updated_at: number;
    } = {
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
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('viewer'), v.literal('user'), v.literal('manager'), v.literal('admin')),
    orgId: v.id('orgs'),
    tokenIdentifier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userData: {
      name: string;
      email: string;
      role: 'viewer' | 'user' | 'manager' | 'admin';
      orgId: Id<'orgs'>;
      tokenIdentifier?: string;
      created_at: number;
      updated_at: number;
    } = {
      name: args.name,
      email: args.email,
      role: args.role,
      orgId: args.orgId,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    if (args.tokenIdentifier) {
      userData.tokenIdentifier = args.tokenIdentifier;
    }

    const userId = await ctx.db.insert('userProfiles', userData);
    return userId;
  },
});

/**
 * ユーザーのtokenIdentifierを更新（テスト用）
 */
export const updateUserToken = mutation({
  args: {
    userId: v.id('userProfiles'),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      tokenIdentifier: args.tokenIdentifier,
      updated_at: Date.now(),
    });
    return { success: true };
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
