/**
 * @fileoverview 承認テーブルのスキーマ定義
 *
 * @property {Id<'reports'>} reportId - 承認対象の日報ID
 * @property {Id<'userProfiles'>} managerId - 承認者のID
 * @property {number} approved_at - 承認日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 承認テーブル (approvals)
 * @description マネージャーによる日報の承認記録を管理します。
 */
export const approvalsTable = defineTable({
  reportId: v.id('reports'),
  managerId: v.id('userProfiles'), // manager/admin role required
  status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
  approved_at: v.optional(v.number()),
})
  .index('by_report', ['reportId'])
  .index('by_manager', ['managerId'])
  .index('by_report_status', ['reportId', 'status'])
  .index('by_approval_time', ['approved_at']);
