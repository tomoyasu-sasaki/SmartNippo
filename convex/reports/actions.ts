/**
 * @fileoverview レポート関連のアクション
 */
import { v } from 'convex/values';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action } from '../_generated/server';

const workItemInputValidator = v.object({
  _id: v.optional(v.id('workItems')),
  projectId: v.id('projects'),
  workCategoryId: v.id('workCategories'),
  description: v.string(),
  workDuration: v.number(),
  _isDeleted: v.optional(v.boolean()),
});

export const saveReportWithWorkItems = action({
  args: {
    reportId: v.optional(v.id('reports')),
    reportData: v.object({
      reportDate: v.string(),
      projectId: v.optional(v.id('projects')),
      title: v.string(),
      content: v.string(),
      workingHours: v.optional(
        v.object({
          startHour: v.number(),
          startMinute: v.number(),
          endHour: v.number(),
          endMinute: v.number(),
        })
      ),
      metadata: v.optional(
        v.object({
          mood: v.optional(
            v.union(v.literal('positive'), v.literal('neutral'), v.literal('negative'))
          ),
          location: v.optional(v.string()),
          tags: v.optional(v.array(v.string())),
          version: v.optional(v.number()),
          previousReportId: v.optional(v.id('reports')),
          template: v.optional(v.string()),
          difficulty: v.optional(
            v.union(v.literal('easy'), v.literal('medium'), v.literal('hard'))
          ),
          achievements: v.optional(v.array(v.string())),
          challenges: v.optional(v.array(v.string())),
          learnings: v.optional(v.array(v.string())),
          nextActionItems: v.optional(v.array(v.string())),
        })
      ),
    }),
    workItems: v.array(workItemInputValidator),
    expectedUpdatedAt: v.optional(v.number()),
    status: v.optional(v.union(v.literal('draft'), v.literal('submitted'))),
  },
  handler: async (ctx, { reportId, reportData, workItems, expectedUpdatedAt, status }) => {
    let currentReportId: Id<'reports'>;

    // reportData から undefined フィールドを除外
    const cleanReportData: any = {
      reportDate: reportData.reportDate,
      title: reportData.title,
      content: reportData.content,
    };
    if (reportData.workingHours) {
      cleanReportData.workingHours = reportData.workingHours;
    }
    if (reportData.metadata) {
      cleanReportData.metadata = reportData.metadata;
    }
    if (reportData.projectId) {
      cleanReportData.projectId = reportData.projectId;
    }

    // 1. 日報の作成または更新
    if (reportId) {
      // 既存レポートの更新
      const updateArgs: any = {
        reportId,
        ...cleanReportData,
        status: status ?? 'draft',
        expectedUpdatedAt,
      };
      if (reportData.projectId) {
        updateArgs.projectId = reportData.projectId;
      }
      await ctx.runMutation(api.index.updateReport, updateArgs);
      currentReportId = reportId;
    } else {
      // レポートの新規作成
      // submitted で直接作成された場合でも、一度 draft で作成してから update する
      // updateReport に承認フローを開始するロジックが実装されているため
      const createArgs: any = { ...cleanReportData, status: 'draft' };
      if (reportData.projectId) {
        createArgs.projectId = reportData.projectId;
      }
      currentReportId = await ctx.runMutation(api.index.createReport, createArgs);

      if (status === 'submitted') {
        // status を submitted に更新して、承認フローを開始する
        // 新規作成直後のため、作成されたドキュメントを取得してタイムスタンプを渡す
        // 正しいAPIパスを使用してeventual consistencyの問題を回避
        const newReport = await ctx.runQuery(api.index.getReportForEdit, {
          reportId: currentReportId,
        });
        if (!newReport) {
          // 作成直後のため、この状況が発生した場合は現在時刻を使用
          console.warn(
            `Created report ${currentReportId} not found immediately, using current timestamp`
          );
          const fallbackTimestamp = Date.now();
          await ctx.runMutation(api.index.updateReport, {
            reportId: currentReportId,
            status: 'submitted',
            expectedUpdatedAt: fallbackTimestamp,
          });
        } else {
          await ctx.runMutation(api.index.updateReport, {
            reportId: currentReportId,
            status: 'submitted',
            expectedUpdatedAt: newReport.updated_at,
          });
        }
      }
    }

    // 作業項目の処理
    for (const workItem of workItems) {
      const { _id, _isDeleted, ...workItemData } = workItem;

      if (_isDeleted && _id) {
        await ctx.runMutation(api.index._deleteWorkItem, { workItemId: _id });
      } else if (_id) {
        await ctx.runMutation(api.index._updateWorkItem, {
          workItemId: _id,
          updates: {
            projectId: workItem.projectId,
            workCategoryId: workItem.workCategoryId,
            description: workItem.description,
            workDuration: workItem.workDuration,
          },
        });
      } else if (!_isDeleted) {
        await ctx.runMutation(api.index._createWorkItem, {
          ...workItemData,
          reportId: currentReportId,
          projectId: workItem.projectId,
          workCategoryId: workItem.workCategoryId,
        });
      }
    }

    return currentReportId;
  },
});
