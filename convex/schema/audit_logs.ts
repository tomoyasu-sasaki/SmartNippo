/**
 * @fileoverview 監査ログテーブルのスキーマ定義
 *
 * @property {Id<'userProfiles'> | undefined} actor_id - 操作を実行したユーザーのID (システムイベントの場合はnull)
 * @property {string} action - 実行されたアクション (例: 'approveReport')
 * @property {any} payload - アクションに関する詳細データ (JSONオブジェクト)
 * @property {number} created_at - 作成日時
 * @property {Id<'orgs'> | undefined} org_id - 関連する組織のID
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 監査ログテーブル (audit_logs)
 * @description コンプライアンスと監視のため、重要な操作履歴を記録します。
 */
export const auditLogsTable = defineTable({
  actor_id: v.optional(v.id('userProfiles')), // nullable for system events like migration
  action: v.string(), // approveReport, deleteReport, etc.
  payload: v.any(), // JSON object with action details
  created_at: v.number(),
  org_id: v.optional(v.id('orgs')), // RLS: org-based isolation, nullable for system-wide logs
})
  .index('by_org', ['org_id'])
  .index('by_actor', ['actor_id'])
  .index('by_org_action', ['org_id', 'action'])
  .index('by_created_at', ['created_at']);
