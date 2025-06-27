/**
 * @fileoverview コメントテーブルのスキーマ定義
 *
 * @property {Id<'reports'>} reportId - 関連する日報のID
 * @property {Id<'userProfiles'> | undefined} authorId - 作成者のID (システム/AIコメントの場合はnull)
 * @property {string} content - コメント内容
 * @property {'user' | 'system' | 'ai'} type - コメントの種類
 * @property {number} created_at - 作成日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * コメントテーブル (comments)
 * @description ユーザー、システム、AIによるコメントを管理します。
 */
export const commentsTable = defineTable({
  reportId: v.id('reports'),
  authorId: v.optional(v.id('userProfiles')), // nullable for system/AI comments
  content: v.string(),
  type: v.union(
    v.literal('user'), // ユーザーコメント
    v.literal('system'), // システム自動生成
    v.literal('ai') // AI生成コメント/提案
  ),
  created_at: v.number(),
})
  .index('by_report', ['reportId'])
  .index('by_report_type', ['reportId', 'type'])
  .index('by_author', ['authorId'])
  .index('by_created_at', ['created_at']);
