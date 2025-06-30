/**
 * @fileoverview タスクの内部操作Mutation
 * @description アクションからのみ呼び出される、タスクのCRUD操作を定義します。
 */
import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireOwnershipOrManagerRole } from '../auth/auth';

/**
 * [INTERNAL] 作業項目を作成する
 */
export const _createWorkItem = mutation({
  args: {
    reportId: v.id('reports'),
    projectId: v.id('projects'),
    workCategoryId: v.id('workCategories'),
    description: v.string(),
    workDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    return await ctx.db.insert('workItems', {
      ...args,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

/**
 * [INTERNAL] 作業項目を更新する
 */
export const _updateWorkItem = mutation({
  args: {
    workItemId: v.id('workItems'),
    updates: v.object({
      projectId: v.optional(v.id('projects')),
      workCategoryId: v.optional(v.id('workCategories')),
      description: v.optional(v.string()),
      workDuration: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { workItemId, updates }) => {
    const workItem = await ctx.db.get(workItemId);
    if (!workItem) {
      throw new Error('WorkItem not found');
    }
    const report = await ctx.db.get(workItem.reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    const patchData: any = { updated_at: Date.now() };
    if (updates.projectId !== undefined) {
      patchData.projectId = updates.projectId;
    }
    if (updates.workCategoryId !== undefined) {
      patchData.workCategoryId = updates.workCategoryId;
    }
    if (updates.description !== undefined) {
      patchData.description = updates.description;
    }
    if (updates.workDuration !== undefined) {
      patchData.workDuration = updates.workDuration;
    }

    await ctx.db.patch(workItemId, patchData);
  },
});

/**
 * [INTERNAL] 作業項目を削除する
 */
export const _deleteWorkItem = mutation({
  args: { workItemId: v.id('workItems') },
  handler: async (ctx, { workItemId }) => {
    const workItem = await ctx.db.get(workItemId);
    if (!workItem) {
      throw new Error('WorkItem not found');
    }
    const report = await ctx.db.get(workItem.reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    await ctx.db.delete(workItemId);
  },
});
