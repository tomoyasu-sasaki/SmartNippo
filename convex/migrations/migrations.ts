/**
 * @fileoverview データベースマイグレーション管理
 *
 * @description データベーススキーマの移行とバージョン管理を行う機能を提供します。
 * スキーマバージョンの追跡、個別レコードのマイグレーション実行、統計情報の取得などを管理します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

/**
 * 現在のスキーマバージョン取得
 *
 * @description データベースに記録されている最新のスキーマバージョンを取得します。
 * マイグレーション実行前の現状確認や、バージョン比較に使用します。
 *
 * @query
 * @returns {Promise<number>} 現在のスキーマバージョン番号（デフォルト: 0）
 * @example
 * ```typescript
 * const currentVersion = await getCurrentSchemaVersion();
 * console.log('Current schema version:', currentVersion);
 * ```
 * @since 1.0.0
 */
export const getCurrentSchemaVersion = query({
  args: {},
  handler: async (ctx) => {
    const latestVersion = await ctx.db.query('schema_versions').order('desc').first();
    return latestVersion?.version ?? 0;
  },
});

/**
 * スキーマバージョンの記録
 *
 * @description 新しいスキーマバージョンの適用を記録します。
 * マイグレーション実行後に呼び出し、バージョン履歴とロールバック情報を保存します。
 *
 * @mutation
 * @param {Object} args - バージョン情報
 * @param {number} args.version - バージョン番号
 * @param {string} args.name - バージョンの名前
 * @param {string} args.description - バージョンの説明
 * @param {string} [args.rollbackScript] - ロールバック用スクリプト
 * @returns {Promise<Id<'schema_versions'>>} 作成されたバージョンレコードのID
 * @example
 * ```typescript
 * const versionId = await recordSchemaVersion({
 *   version: 2,
 *   name: 'Enhanced Reports',
 *   description: 'Added AI summary and extended metadata fields',
 *   rollbackScript: 'ALTER TABLE reports DROP COLUMN aiSummaryStatus'
 * });
 * ```
 * @since 1.0.0
 */
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

/**
 * 全レポートデータ取得
 *
 * @description マイグレーション処理用に全てのレポートレコードを取得します。
 * 大量データの一括処理時に使用するため、パフォーマンスに注意が必要です。
 *
 * @query
 * @returns {Promise<Report[]>} 全レポートレコードの配列
 * @example
 * ```typescript
 * const allReports = await getAllReports();
 * console.log(`Processing ${allReports.length} reports for migration`);
 * ```
 * @since 1.0.0
 */
export const getAllReports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('reports').collect();
  },
});

/**
 * 個別レポートレコードのマイグレーション
 *
 * @description 指定されたレポートレコードに対してフィールド拡張とデフォルト値設定を実行します。
 * AI要約ステータス、タスク拡張フィールド、添付ファイル情報、メタデータ、タイムスタンプなどを更新します。
 *
 * @mutation
 * @param {Object} args - マイグレーション対象
 * @param {Id<'reports'>} args.reportId - 対象レポートのID
 * @returns {Promise<void>} マイグレーション完了
 * @example
 * ```typescript
 * await migrateReportRecord({ reportId: 'report123' });
 * console.log('Report migration completed');
 * ```
 * @since 1.0.0
 */
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

/**
 * スキーマバージョン履歴取得
 *
 * @description 適用されたスキーマバージョンの履歴を新しい順で取得します。
 * マイグレーション状況の確認やロールバック計画の策定に使用します。
 *
 * @query
 * @returns {Promise<SchemaVersion[]>} スキーマバージョン履歴の配列
 * @example
 * ```typescript
 * const history = await getSchemaVersionHistory();
 * history.forEach(version => {
 *   console.log(`Version ${version.version}: ${version.name}`);
 * });
 * ```
 * @since 1.0.0
 */
export const getSchemaVersionHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('schema_versions').order('desc').collect();
  },
});

/**
 * データベーステーブル統計取得
 *
 * @description 各テーブルのレコード数を集計し、データベース全体の統計情報を提供します。
 * マイグレーション前後の比較や、システム状況の監視に使用します。
 *
 * @query
 * @returns {Promise<Object>} 各テーブルのレコード数と取得時刻を含む統計オブジェクト
 * @example
 * ```typescript
 * const stats = await getTableStats();
 * console.log(`Users: ${stats.users}, Reports: ${stats.reports}`);
 * console.log(`Total audit logs: ${stats.auditLogs}`);
 * ```
 * @since 1.0.0
 */
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
