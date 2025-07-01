/**
 * @fileoverview 承認フロー関連のクエリ定義
 */
import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { internalQuery, query } from '../_generated/server';
import { requireAuthentication } from '../auth/auth';

/**
 * プロジェクトに紐づく承認フロールールの一覧を取得する
 * @param projectId - 対象のプロジェクトID
 * @returns {Promise<Array<Doc<'approvalFlows'> & { approver: Doc<'userProfiles'> | null, applicant?: Doc<'userProfiles'> | null }>>}
 */
export const listByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthentication(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project || project.orgId !== user.orgId) {
      throw new Error('Project not found or permission denied.');
    }

    const flows = await ctx.db
      .query('approvalFlows')
      .withIndex('by_org_project', (q) =>
        q.eq('orgId', user.orgId!).eq('projectId', args.projectId)
      )
      .collect();

    const result = await Promise.all(
      flows.map(async (flow) => {
        const approver = await ctx.db.get(flow.approverId);
        const applicant = flow.applicantId ? await ctx.db.get(flow.applicantId) : undefined;

        return {
          ...flow,
          approver,
          applicant,
        };
      })
    );

    return result;
  },
});

/**
 * 特定の日報に対する承認者リストを取得する
 * @param projectId - 対象のプロジェクトID
 * @param applicantId - 申請者のユーザーID
 * @returns {Promise<Array<Doc<'userProfiles'>>>} 承認者のユーザープロファイルリスト
 */
export const findApprovers = internalQuery({
  args: {
    projectId: v.id('projects'),
    applicantId: v.id('userProfiles'),
  },
  handler: async (ctx, args) => {
    // 1. 申請者固有のルールを検索
    const specificFlow = await ctx.db
      .query('approvalFlows')
      .withIndex('by_project_applicant', (q) =>
        q.eq('projectId', args.projectId).eq('applicantId', args.applicantId)
      )
      .unique();

    if (specificFlow) {
      const approver = await ctx.db.get(specificFlow.approverId);
      return approver ? [approver] : [];
    }

    // 2. プロジェクト共通のルールを検索 (applicantIdが未指定のものを探す)
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    const genericFlows = await ctx.db
      .query('approvalFlows')
      .withIndex('by_org_project', (q) =>
        q.eq('orgId', project.orgId).eq('projectId', args.projectId)
      )
      .filter((q) => q.eq(q.field('applicantId'), undefined))
      .collect();

    if (genericFlows.length > 0) {
      const approverIds = genericFlows.map((f) => f.approverId);
      const approvers = await Promise.all(approverIds.map((id) => ctx.db.get(id)));
      return approvers.filter(Boolean) as Doc<'userProfiles'>[];
    }

    // 3. ルールが見つからなければ空配列を返す
    return [];
  },
});
