/**
 * @fileoverview プロジェクトテーブルのスキーマ定義
 *
 * @property {Id<'orgs'>} orgId - 所属組織ID
 * @property {string} name - プロジェクト名
 * @property {string | undefined} description - 説明
 * @property {number} created_at - 作成日時
 * @property {number} updated_at - 更新日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * プロジェクトテーブル (projects)
 * @description 組織ごとに管理されるプロジェクトマスタ。
 */
export const projectsTable = defineTable({
  orgId: v.id('orgs'),
  name: v.string(),
  description: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index('by_org', ['orgId'])
  .index('by_org_name', ['orgId', 'name'])
  .index('by_created_at', ['created_at']);
