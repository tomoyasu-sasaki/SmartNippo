/**
 * @fileoverview 作業項目テーブルのスキーマ定義
 *
 * @property {Id<'reports'>} reportId - 紐づく日報ID
 * @property {number} workDuration - 作業時間（分）
 * @property {Id<'projects'>} projectId - プロジェクトID
 * @property {Id<'workCategories'>} workCategoryId - 作業区分ID
 * @property {string} description - 作業内容
 * @property {number} created_at - 作成日時
 * @property {number} updated_at - 更新日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 作業項目テーブル (workItems)
 * @description 日報に紐づく作業項目情報を管理します。
 */
export const workItemsTable = defineTable({
  reportId: v.id('reports'),
  workDuration: v.number(), // 作業時間（分）
  projectId: v.id('projects'), // プロジェクトID
  workCategoryId: v.id('workCategories'), // 作業区分ID
  description: v.string(), // 作業内容
  created_at: v.number(),
  updated_at: v.number(),
})
  .index('by_report', ['reportId'])
  .index('by_project', ['projectId'])
  .index('by_created_at', ['created_at']);
