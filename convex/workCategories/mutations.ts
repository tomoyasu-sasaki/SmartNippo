/**
 * @fileoverview 作業区分管理 Mutation
 */
import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAdminAccess } from '../auth/auth';

export const createWorkCategory = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
  },
  handler: async (ctx, { projectId, name }) => {
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error('プロジェクトが見つかりません');
    }

    await requireAdminAccess(ctx, project.orgId);

    // 重複チェック
    const duplicate = await ctx.db
      .query('workCategories')
      .withIndex('by_project_name', (q) => q.eq('projectId', projectId).eq('name', name))
      .unique();

    if (duplicate) {
      throw new Error('同じ名前の作業区分が既に存在します');
    }

    const id = await ctx.db.insert('workCategories', {
      projectId,
      name,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    return id;
  },
});

export const updateWorkCategory = mutation({
  args: {
    workCategoryId: v.id('workCategories'),
    name: v.string(),
  },
  handler: async (ctx, { workCategoryId, name }) => {
    const category = await ctx.db.get(workCategoryId);
    if (!category) {
      throw new Error('作業区分が見つかりません');
    }

    const project = await ctx.db.get(category.projectId);
    if (!project) {
      throw new Error('関連するプロジェクトが見つかりません');
    }

    await requireAdminAccess(ctx, project.orgId);

    // 重複チェック
    const duplicate = await ctx.db
      .query('workCategories')
      .withIndex('by_project_name', (q) => q.eq('projectId', project._id).eq('name', name))
      .unique();
    if (duplicate && duplicate._id !== workCategoryId) {
      throw new Error('同名の作業区分が存在します');
    }

    await ctx.db.patch(workCategoryId, { name, updated_at: Date.now() });
    return { success: true };
  },
});

export const deleteWorkCategory = mutation({
  args: { workCategoryId: v.id('workCategories') },
  handler: async (ctx, { workCategoryId }) => {
    const category = await ctx.db.get(workCategoryId);
    if (!category) {
      throw new Error('作業区分が見つかりません');
    }

    const project = await ctx.db.get(category.projectId);
    if (!project) {
      throw new Error('関連するプロジェクトが見つかりません');
    }

    await requireAdminAccess(ctx, project.orgId);

    await ctx.db.delete(workCategoryId);
    return { success: true };
  },
});
