/**
 * @fileoverview プロジェクト管理 Mutation
 */
import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAdminAccess, requireAuthentication } from '../auth/auth';

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { name, description }) => {
    // 認証 & admin 権限チェック
    const authUser = await requireAuthentication(ctx);
    const user = await requireAdminAccess(ctx, authUser.orgId!);

    // 同名プロジェクト重複チェック
    const duplicate = await ctx.db
      .query('projects')
      .withIndex('by_org_name', (q) => q.eq('orgId', user.orgId!).eq('name', name))
      .unique();

    if (duplicate) {
      throw new Error('同じ名前のプロジェクトが既に存在します');
    }

    const now = Date.now();
    const projectData: any = {
      orgId: user.orgId!,
      name,
      created_at: now,
      updated_at: now,
    };
    if (description !== undefined) {
      projectData.description = description;
    }

    const projectId = await ctx.db.insert('projects', projectData);

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, description }) => {
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error('プロジェクトが見つかりません');
    }

    const user = await requireAdminAccess(ctx, project.orgId);

    const updates: any = { updated_at: Date.now() };
    if (name !== undefined) {
      updates.name = name;
    }
    if (description !== undefined) {
      updates.description = description;
    }

    await ctx.db.patch(projectId, updates);
    return { success: true, updated_at: updates.updated_at };
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error('プロジェクトが見つかりません');
    }

    await requireAdminAccess(ctx, project.orgId);

    // 連鎖削除: categories も削除
    const categories = await ctx.db
      .query('workCategories')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    await Promise.all(categories.map((cat) => ctx.db.delete(cat._id)));

    await ctx.db.delete(projectId);
    return { success: true };
  },
});
