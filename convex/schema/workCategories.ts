/**
 * @fileoverview 作業区分テーブルのスキーマ定義
 *
 * @property {Id<'projects'>} projectId - 紐づくプロジェクトID
 * @property {string} name - 作業区分名
 * @property {number} created_at - 作成日時
 * @property {number} updated_at - 更新日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 作業区分テーブル (workCategories)
 * @description プロジェクトごとに管理される作業区分マスタ。
 */
export const workCategoriesTable = defineTable({
  projectId: v.id('projects'),
  name: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index('by_project', ['projectId'])
  .index('by_project_name', ['projectId', 'name'])
  .index('by_created_at', ['created_at']);
