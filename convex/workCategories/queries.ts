/**
 * @fileoverview 作業区分管理 Query
 */
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuthentication } from '../auth/auth';

export const listWorkCategories = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const user = await requireAuthentication(ctx);

    // プロジェクトが属する org を確認してアクセス制御
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error('プロジェクトが見つかりません');
    }
    if (project.orgId !== user.orgId) {
      throw new Error('アクセス権限がありません');
    }

    return await ctx.db
      .query('workCategories')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();
  },
});
