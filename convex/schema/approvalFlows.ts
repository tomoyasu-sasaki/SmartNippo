/**
 * @fileoverview 承認フロー定義テーブルのスキーマ
 *
 * @property {Id<'orgs'>} orgId - 所属組織ID
 * @property {Id<'projects'>} projectId - 関連プロジェクトID
 * @property {Id<'userProfiles'>} approverId - 承認者のユーザーID
 * @property {Id<'userProfiles'> | undefined} applicantId - 申請者のユーザーID (特定の申請者にのみ適用する場合)
 * @property {number | undefined} approvalLevel - 承認段階 (将来の多段階承認のための拡張用)
 * @property {number} created_at - 作成日時
 * @property {number} updated_at - 更新日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 承認フローテーブル (approvalFlows)
 * @description どのプロジェクトの申請を、誰が承認するかを定義します。
 *              このテーブルにより、プロジェクト単位、あるいはユーザー単位での柔軟な承認者設定が可能です。
 */
export const approvalFlowsTable = defineTable({
  orgId: v.id('orgs'),
  projectId: v.id('projects'),

  // 承認者のID (userProfilesテーブルのmanager/adminロールを持つユーザー)
  approverId: v.id('userProfiles'),

  // (オプション)特定の申請者の場合にのみ適用したい場合
  // これが未設定なら、projectIdに属する全ての申請に適用される
  applicantId: v.optional(v.id('userProfiles')),

  // (オプション)将来の多段階承認のための拡張
  // 例: 1: 一次承認, 2: 二次承認
  approvalLevel: v.optional(v.number()),

  created_at: v.number(),
  updated_at: v.number(),
})
  .index('by_org_project', ['orgId', 'projectId'])
  .index('by_project_applicant', ['projectId', 'applicantId'])
  .index('by_approver', ['approverId']);
