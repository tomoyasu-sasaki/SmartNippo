/**
 * @fileoverview プロジェクト管理 Query
 */
import { query } from '../_generated/server';
import { requireAuthentication } from '../auth/auth';

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthentication(ctx);

    return await ctx.db
      .query('projects')
      .withIndex('by_org', (q) => q.eq('orgId', user.orgId!))
      .collect();
  },
});
