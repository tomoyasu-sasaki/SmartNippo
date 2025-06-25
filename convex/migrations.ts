import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// 現在のスキーマバージョンを取得
export const getCurrentSchemaVersion = query({
  args: {},
  handler: async (ctx) => {
    const latestVersion = await ctx.db.query('schema_versions').order('desc').first();
    return latestVersion?.version ?? 0;
  },
});

// スキーマバージョンを記録
export const recordSchemaVersion = mutation({
  args: {
    version: v.number(),
    name: v.string(),
    description: v.string(),
    rollbackScript: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('schema_versions', {
      ...args,
      appliedAt: Date.now(),
    });
  },
});

// 全レポート取得
export const getAllReports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('reports').collect();
  },
});

// 個別レポートのマイグレーション
export const migrateReportRecord = mutation({
  args: { reportId: v.id('reports') },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) {
      return;
    }

    // 既存データに新しいフィールドのデフォルト値を設定
    const migrationUpdates: any = {};

    // AI要約ステータスの初期化
    if (!('aiSummaryStatus' in report)) {
      migrationUpdates.aiSummaryStatus = report.summary ? 'completed' : undefined;
    }

    // タスクの拡張フィールド初期化
    if (report.tasks && Array.isArray(report.tasks)) {
      migrationUpdates.tasks = report.tasks.map((task: any) => ({
        ...task,
        estimatedHours: task.estimatedHours ?? undefined,
        actualHours: task.actualHours ?? undefined,
        category: task.category ?? undefined,
      }));
    }

    // 添付ファイルの拡張フィールド初期化
    if (report.attachments && Array.isArray(report.attachments)) {
      migrationUpdates.attachments = report.attachments.map((attachment: any) => ({
        ...attachment,
        uploadedAt: attachment.uploadedAt ?? report.created_at,
        description: attachment.description ?? undefined,
      }));
    }

    // メタデータの拡張フィールド初期化
    if (report.metadata) {
      migrationUpdates.metadata = {
        ...report.metadata,
        version: 1,
        previousReportId: undefined,
        template: undefined,
        difficulty: undefined,
        achievements: [],
        challenges: [],
        learnings: [],
        nextActionItems: [],
      };
    }

    // 新しいタイムスタンプフィールド初期化
    if (report.status === 'submitted' && !('submittedAt' in report)) {
      migrationUpdates.submittedAt = report.updated_at;
    }
    if (report.status === 'approved' && !('approvedAt' in report)) {
      migrationUpdates.approvedAt = report.updated_at;
    }

    // 削除関連フィールド初期化
    if (report.isDeleted && !('deletedAt' in report)) {
      migrationUpdates.deletedAt = report.updated_at;
      migrationUpdates.deletedBy = report.authorId;
    }

    // 編集履歴初期化
    migrationUpdates.editHistory = [];

    // 更新実行
    if (Object.keys(migrationUpdates).length > 0) {
      await ctx.db.patch(reportId, migrationUpdates);
    }
  },
});

// スキーマバージョン履歴取得
export const getSchemaVersionHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('schema_versions').order('desc').collect();
  },
});

// テーブル統計取得
export const getTableStats = query({
  args: {},
  handler: async (ctx) => {
    const [orgs, users, reports, comments, approvals, auditLogs, schemaVersions] =
      await Promise.all([
        ctx.db.query('orgs').collect(),
        ctx.db.query('userProfiles').collect(),
        ctx.db.query('reports').collect(),
        ctx.db.query('comments').collect(),
        ctx.db.query('approvals').collect(),
        ctx.db.query('audit_logs').collect(),
        ctx.db.query('schema_versions').collect(),
      ]);

    return {
      orgs: orgs.length,
      users: users.length,
      reports: reports.length,
      comments: comments.length,
      approvals: approvals.length,
      auditLogs: auditLogs.length,
      schemaVersions: schemaVersions.length,
      timestamp: Date.now(),
    };
  },
});
