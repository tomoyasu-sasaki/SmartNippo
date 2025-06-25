/**
 * @fileoverview バックアップ情報取得クエリ
 *
 * @description バックアップ履歴、統計情報、復旧手順ガイドなど、
 * バックアップシステムに関する情報を取得するためのクエリ関数を提供します。
 *
 * @since 1.0.0
 */

import { query } from '../_generated/server';
import { BACKUP_CONFIG } from './config';

/**
 * バックアップ実行履歴の取得
 *
 * @description 監査ログからバックアップ関連のイベントを抽出し、
 * 実行履歴として整形して返します。最新50件のバックアップ状況を確認できます。
 *
 * @query
 * @returns {Promise<Object>} バックアップ履歴情報
 * @returns {Object[]} returns.backups - バックアップ履歴の配列
 * @returns {number} returns.totalBackups - 取得したバックアップ総数
 * @returns {Object} returns.lastBackup - 最新のバックアップ情報
 * @returns {Object} returns.retentionPolicy - バックアップ保持設定
 * @example
 * ```typescript
 * const history = await getBackupHistory();
 * console.log(`Total backups: ${history.totalBackups}`);
 * history.backups.forEach(backup => {
 *   console.log(`- ${new Date(backup.startTime)} [${backup.status}]`);
 * });
 * ```
 * @since 1.0.0
 */
export const getBackupHistory = query({
  args: {},
  handler: async (ctx) => {
    const backupEvents = await ctx.db
      .query('audit_logs')
      .filter((q) =>
        q.or(
          q.eq(q.field('action'), 'backup_started'),
          q.eq(q.field('action'), 'backup_completed'),
          q.eq(q.field('action'), 'backup_failed'),
          q.eq(q.field('action'), 'incremental_backup_completed')
        )
      )
      .order('desc')
      .take(50);

    // バックアップをグループ化
    const backups = [];
    let currentBackup: any = null;

    for (const event of backupEvents) {
      if (event.action === 'backup_started') {
        currentBackup = {
          startTime: event.created_at,
          status: 'running',
          metadata: event.payload.metadata,
          details: event.payload.details,
        };
      } else if (
        currentBackup &&
        (event.action === 'backup_completed' || event.action === 'backup_failed')
      ) {
        currentBackup.endTime = event.created_at;
        currentBackup.status = event.action === 'backup_completed' ? 'completed' : 'failed';
        currentBackup.duration = currentBackup.endTime - currentBackup.startTime;
        backups.push({ ...currentBackup });
        currentBackup = null;
      } else if (event.action === 'incremental_backup_completed') {
        backups.push({
          startTime: event.created_at,
          endTime: event.created_at,
          status: 'completed',
          type: 'incremental',
          metadata: event.payload.metadata,
          details: event.payload.details,
          duration: 0, // 増分バックアップは通常短時間
        });
      }
    }

    return {
      backups,
      totalBackups: backups.length,
      lastBackup: backups[0],
      retentionPolicy: BACKUP_CONFIG,
    };
  },
});

/**
 * バックアップ統計情報の取得
 *
 * @description 直近30日間のバックアップ成功率や、現在のデータベース全体の
 * ドキュメント数などの統計情報を集計して返します。
 * システムの健全性監視や容量計画に利用できます。
 *
 * @query
 * @returns {Promise<Object>} バックアップ統計情報
 * @returns {Object} returns.last30Days - 直近30日間の統計
 * @returns {Object} returns.currentDatabase - 現在のデータベース統計
 * @returns {Object} returns.config - 現在のバックアップ設定
 * @returns {number} returns.lastUpdate - 最終更新時刻
 * @example
 * ```typescript
 * const stats = await getBackupStatistics();
 * console.log(`Success rate (last 30 days): ${stats.last30Days.successRate}%`);
 * console.log(`Total documents: ${stats.currentDatabase.totalDocuments}`);
 * ```
 * @since 1.0.0
 */
export const getBackupStatistics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;

    const recentBackups = await ctx.db
      .query('audit_logs')
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field('action'), 'backup_completed'),
            q.eq(q.field('action'), 'backup_failed'),
            q.eq(q.field('action'), 'incremental_backup_completed')
          ),
          q.gte(q.field('created_at'), last30Days)
        )
      )
      .collect();

    const successful = recentBackups.filter(
      (b) => b.action === 'backup_completed' || b.action === 'incremental_backup_completed'
    );
    const failed = recentBackups.filter((b) => b.action === 'backup_failed');

    const totalDocuments = await Promise.all([
      ctx.db
        .query('orgs')
        .collect()
        .then((docs: any[]) => docs.length),
      ctx.db
        .query('userProfiles')
        .collect()
        .then((docs: any[]) => docs.length),
      ctx.db
        .query('reports')
        .collect()
        .then((docs: any[]) => docs.length),
      ctx.db
        .query('comments')
        .collect()
        .then((docs: any[]) => docs.length),
      ctx.db
        .query('approvals')
        .collect()
        .then((docs: any[]) => docs.length),
      ctx.db
        .query('audit_logs')
        .collect()
        .then((docs: any[]) => docs.length),
      ctx.db
        .query('schema_versions')
        .collect()
        .then((docs: any[]) => docs.length),
    ]);

    return {
      last30Days: {
        total: recentBackups.length,
        successful: successful.length,
        failed: failed.length,
        successRate:
          recentBackups.length > 0 ? (successful.length / recentBackups.length) * 100 : 0,
      },
      currentDatabase: {
        totalDocuments: totalDocuments.reduce((sum, count) => sum + count, 0),
        tableBreakdown: {
          orgs: totalDocuments[0],
          userProfiles: totalDocuments[1],
          reports: totalDocuments[2],
          comments: totalDocuments[3],
          approvals: totalDocuments[4],
          audit_logs: totalDocuments[5],
          schema_versions: totalDocuments[6],
        },
      },
      config: BACKUP_CONFIG,
      lastUpdate: now,
    };
  },
});

/**
 * データ復旧手順ガイドの取得
 *
 * @description データベースをバックアップから復旧させるための手順ガイド、
 * 緊急連絡先、想定時間、前提条件などの情報を提供します。
 * 障害発生時の迅速な対応を支援します。
 *
 * @query
 * @returns {Promise<Object>} 復旧手順ガイド情報
 * @returns {Object[]} returns.procedures - 手順の配列
 * @returns {string[]} returns.emergencyContacts - 緊急連絡先
 * @returns {string} returns.estimatedTime - 想定復旧時間
 * @returns {string[]} returns.prerequisites - 前提条件
 * @example
 * ```typescript
 * const guide = await getRestoreGuide();
 * console.log('--- Restore Guide ---');
 * guide.procedures.forEach(step => {
 *   console.log(`Step ${step.step}: ${step.title}`);
 * });
 * console.log(`Emergency contact: ${guide.emergencyContacts[0]}`);
 * ```
 * @since 1.0.0
 */
export const getRestoreGuide = query({
  args: {},
  handler: async (ctx) => {
    return {
      procedures: [
        {
          step: 1,
          title: 'バックアップの確認',
          description: '復旧に使用するバックアップデータの整合性を確認します',
          command: 'verifyBackupIntegrity',
          warning: 'チェックサムが一致しない場合は別のバックアップを使用してください',
        },
        {
          step: 2,
          title: 'システム停止',
          description: '復旧作業中はシステムへのアクセスを制限します',
          command: 'maintenanceMode',
          warning: '復旧完了まで全ての機能が利用できません',
        },
        {
          step: 3,
          title: 'データベース復旧',
          description: 'バックアップデータからデータベースを復元します',
          command: 'restoreFromBackup',
          warning: '現在のデータは全て上書きされます',
        },
        {
          step: 4,
          title: '整合性確認',
          description: '復旧されたデータの整合性を確認します',
          command: 'validateRestoredData',
          warning: 'エラーがある場合は復旧を中止し、調査が必要です',
        },
        {
          step: 5,
          title: 'システム再開',
          description: 'システムを通常運用に戻します',
          command: 'disableMaintenanceMode',
          warning: '全機能の動作確認を行ってください',
        },
      ],
      emergencyContacts: ['システム管理者: admin@company.com', 'データベース担当: dba@company.com'],
      estimatedTime: '30-60分（データ量により変動）',
      prerequisites: ['システム管理者権限', '復旧用バックアップデータ', 'メンテナンス時間の確保'],
    };
  },
});
