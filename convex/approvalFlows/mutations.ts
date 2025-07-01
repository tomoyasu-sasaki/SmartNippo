/**
 * @fileoverview 承認フロー関連のmutation定義
 */
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { mutation } from '../_generated/server';
import { requireAdminAccess, requireAuthentication } from '../auth/auth';

/**
 * 承認フローのルールを設定（作成・更新）する
 * @param projectId - 対象のプロジェクトID
 * @param approverId - 承認者のユーザーID
 * @param applicantId - (Optional) 対象の申請者ID
 * @param approvalLevel - (Optional) 承認レベル
 * @returns {Promise<Id<'approvalFlows'>>} 作成または更新されたドキュメントのID
 */
export const set = mutation({
  args: {
    projectId: v.id('projects'),
    approverId: v.id('userProfiles'),
    applicantId: v.optional(v.id('userProfiles')),
    approvalLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthentication(ctx);
    await requireAdminAccess(ctx, user.orgId!);

    const existingFlow = await ctx.db
      .query('approvalFlows')
      .withIndex('by_project_applicant', (q) =>
        q.eq('projectId', args.projectId).eq('applicantId', args.applicantId)
      )
      .first();

    if (existingFlow) {
      const patchData: {
        approverId: Id<'userProfiles'>;
        approvalLevel?: number;
        updated_at: number;
      } = {
        approverId: args.approverId,
        updated_at: Date.now(),
      };
      if (args.approvalLevel !== undefined) {
        patchData.approvalLevel = args.approvalLevel;
      }
      await ctx.db.patch(existingFlow._id, patchData);
      return existingFlow._id;
    }

    const insertData: {
      orgId: Id<'orgs'>;
      projectId: Id<'projects'>;
      approverId: Id<'userProfiles'>;
      applicantId?: Id<'userProfiles'>;
      approvalLevel?: number;
      created_at: number;
      updated_at: number;
    } = {
      orgId: user.orgId!,
      projectId: args.projectId,
      approverId: args.approverId,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    if (args.applicantId !== undefined) {
      insertData.applicantId = args.applicantId;
    }
    if (args.approvalLevel !== undefined) {
      insertData.approvalLevel = args.approvalLevel;
    }

    const flowId = await ctx.db.insert('approvalFlows', insertData);

    return flowId;
  },
});

/**
 * 承認フローのルールを削除する
 * @param flowId - 削除対象の承認フロールールID
 * @returns {Promise<void>}
 */
export const remove = mutation({
  args: {
    flowId: v.id('approvalFlows'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthentication(ctx);

    const flow = await ctx.db.get(args.flowId);
    if (!flow) {
      throw new Error('Flow not found.');
    }
    await requireAdminAccess(ctx, flow.orgId);

    if (flow.orgId !== user.orgId) {
      throw new Error('Permission denied.');
    }

    await ctx.db.delete(args.flowId);
  },
});
