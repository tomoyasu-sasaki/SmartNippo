/**
 * @fileoverview 組織テーブルのスキーマ定義
 *
 * @property {string} name - 組織名
 * @property {'free' | 'pro' | 'enterprise'} plan - 料金プラン
 * @property {number} created_at - 作成日時 (Unixタイムスタンプ)
 * @property {number} updated_at - 更新日時 (Unixタイムスタンプ)
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 組織テーブル (orgs)
 * @description マルチテナントの基盤となる組織情報を管理します。
 */
export const orgsTable = defineTable({
  clerkId: v.string(), // Clerk Organization ID
  name: v.string(),
  plan: v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
  created_at: v.number(), // Unix timestamp
  updated_at: v.number(),
})
  .index('by_clerk_id', ['clerkId'])
  .index('by_created_at', ['created_at'])
  .index('by_plan', ['plan']);
