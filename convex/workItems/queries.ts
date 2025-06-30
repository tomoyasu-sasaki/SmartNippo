/**
 * @fileoverview 作業項目関連のクエリ
 */
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireOwnershipOrManagerRole } from '../auth/auth';

/**
 * 指定された日報に紐づく作業項目の一覧を取得します。
 *
 * @param {Id<'reports'>} reportId - 日報のID
 * @returns {Promise<Doc<'workItems'>[]>} 作業項目の配列
 * @throws {Error} 日報が見つからない場合、またはアクセス権限がない場合
 */
export const listWorkItemsForReport = query({
  args: { reportId: v.id('reports') },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new Error('日報が見つかりません');
    }
    // 権限チェック：レポートの所有者または管理者のみが閲覧可能
    await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    const workItems = await ctx.db
      .query('workItems')
      .withIndex('by_report', (q) => q.eq('reportId', reportId))
      .collect();

    return Promise.all(
      workItems.map(async (workItem) => {
        const project = await ctx.db.get(workItem.projectId);
        const workCategory = await ctx.db.get(workItem.workCategoryId);
        return {
          ...workItem,
          projectName: project?.name,
          workCategoryName: workCategory?.name,
        };
      })
    );
  },
});
