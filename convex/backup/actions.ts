/**
 * @fileoverview バックアップ実行アクション
 *
 * @description データベースの完全バックアップ、増分バックアップ、整合性チェック、
 * イベント記録などのバックアップ関連のアクション関数を提供します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { action, internalMutation } from '../_generated/server';
import type { BackupMetadata } from './config';
import { collectAllTableData, collectIncrementalData, generateChecksum } from './helpers';

/**
 * 完全バックアップの作成実行
 *
 * @description 全テーブルのデータを取得し、完全バックアップを作成します。
 * メタデータ生成、チェックサム計算、監査ログ記録を含む包括的なバックアップ処理を実行し、
 * バックアップの開始から完了まで全過程を追跡します。
 *
 * @action
 * @param {Object} args - バックアップパラメータ
 * @param {string} [args.description] - バックアップの説明（省略時は自動生成）
 * @param {boolean} [args.includeDeleted=false] - 削除済みレコードを含めるかどうか
 * @returns {Promise<Object>} バックアップ実行結果
 * @returns {boolean} returns.success - 実行成功の可否
 * @returns {BackupMetadata} [returns.metadata] - バックアップメタデータ（成功時）
 * @returns {Object} [returns.backup] - バックアップデータ（成功時）
 * @returns {number} returns.duration - 実行時間（ミリ秒）
 * @returns {string} [returns.message] - 成功メッセージ（成功時）
 * @returns {string} [returns.error] - エラーメッセージ（失敗時）
 * @example
 * ```typescript
 * const result = await createFullBackup({
 *   description: 'Monthly backup',
 *   includeDeleted: false
 * });
 *
 * if (result.success) {
 *   console.log(`Backup completed: ${result.message}`);
 *   console.log(`Duration: ${result.duration}ms`);
 * } else {
 *   console.error('Backup failed:', result.error);
 * }
 * ```
 * @since 1.0.0
 */
export const createFullBackup = action({
  args: {
    description: v.optional(v.string()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, { description, includeDeleted = false }) => {
    const backupStartTime = Date.now();

    try {
      console.log('Starting full backup...');

      // 全テーブルのデータを取得
      const backupData = await collectAllTableData(ctx, includeDeleted);

      // メタデータ作成
      const metadata: BackupMetadata = {
        version: 1,
        timestamp: backupStartTime,
        description: description ?? `Full backup ${new Date(backupStartTime).toISOString()}`,
        tables: Object.entries(backupData).map(([tableName, documents]) => ({
          name: tableName,
          documentCount: documents.length,
          size: JSON.stringify(documents).length,
        })),
        totalDocuments: Object.values(backupData).reduce((sum, docs) => sum + docs.length, 0),
        totalSize: JSON.stringify(backupData).length,
        checksum: generateChecksum(JSON.stringify(backupData)),
      };

      // バックアップ記録をaudit_logsに保存
      await ctx.runMutation(internal.backup.actions.recordBackupEvent, {
        eventType: 'backup_started',
        metadata,
        details: 'Full backup initiated',
      });

      const backupEndTime = Date.now();
      const duration = backupEndTime - backupStartTime;

      console.log(`Backup completed in ${duration}ms`);

      // 完了記録
      await ctx.runMutation(internal.backup.actions.recordBackupEvent, {
        eventType: 'backup_completed',
        metadata,
        details: `Backup completed successfully in ${Math.round(duration / 1000)}s`,
      });

      return {
        success: true,
        metadata,
        backup: backupData,
        duration,
        message: `Successfully backed up ${metadata.totalDocuments} documents from ${metadata.tables.length} tables`,
      };
    } catch (error) {
      console.error('Backup failed:', error);

      await ctx.runMutation(internal.backup.actions.recordBackupEvent, {
        eventType: 'backup_failed',
        metadata: { timestamp: backupStartTime, error: String(error) },
        details: `Backup failed: ${String(error)}`,
      });

      return {
        success: false,
        error: String(error),
        duration: Date.now() - backupStartTime,
      };
    }
  },
});

/**
 * 増分バックアップの作成実行
 *
 * @description 指定された時刻以降に変更されたデータのみを収集し、増分バックアップを作成します。
 * ストレージ効率を向上させ、頻繁なバックアップを可能にする軽量なバックアップソリューションです。
 *
 * @action
 * @param {Object} args - 増分バックアップパラメータ
 * @param {number} args.since - 基準時刻（UNIX timestamp）
 * @param {string} [args.description] - バックアップの説明（省略時は自動生成）
 * @returns {Promise<Object>} 増分バックアップ実行結果
 * @returns {boolean} returns.success - 実行成功の可否
 * @returns {BackupMetadata} [returns.metadata] - バックアップメタデータ（成功時）
 * @returns {Object} [returns.backup] - 増分バックアップデータ（成功時）
 * @returns {number} returns.duration - 実行時間（ミリ秒）
 * @returns {string} [returns.sinceDatetime] - 基準時刻のISO文字列（成功時）
 * @returns {string} [returns.error] - エラーメッセージ（失敗時）
 * @example
 * ```typescript
 * const lastBackupTime = Date.now() - 24 * 60 * 60 * 1000; // 24時間前
 * const result = await createIncrementalBackup({
 *   since: lastBackupTime,
 *   description: 'Daily incremental backup'
 * });
 *
 * if (result.success) {
 *   console.log(`Incremental backup since ${result.sinceDatetime}`);
 *   console.log(`Changed documents: ${result.metadata?.totalDocuments}`);
 * }
 * ```
 * @since 1.0.0
 */
export const createIncrementalBackup = action({
  args: {
    since: v.number(), // タイムスタンプ
    description: v.optional(v.string()),
  },
  handler: async (ctx, { since, description }) => {
    const backupStartTime = Date.now();

    try {
      console.log(`Starting incremental backup since ${new Date(since).toISOString()}...`);

      // 変更されたドキュメントのみを取得
      const incrementalData = await collectIncrementalData(ctx, since);

      const metadata: BackupMetadata = {
        version: 1,
        timestamp: backupStartTime,
        description: description ?? `Incremental backup since ${new Date(since).toISOString()}`,
        tables: Object.entries(incrementalData).map(([tableName, documents]) => ({
          name: tableName,
          documentCount: documents.length,
          size: JSON.stringify(documents).length,
        })),
        totalDocuments: Object.values(incrementalData).reduce((sum, docs) => sum + docs.length, 0),
        totalSize: JSON.stringify(incrementalData).length,
        checksum: generateChecksum(JSON.stringify(incrementalData)),
      };

      const duration = Date.now() - backupStartTime;

      await ctx.runMutation(internal.backup.actions.recordBackupEvent, {
        eventType: 'incremental_backup_completed',
        metadata,
        details: `Incremental backup completed in ${Math.round(duration / 1000)}s`,
      });

      return {
        success: true,
        metadata,
        backup: incrementalData,
        duration,
        sinceDatetime: new Date(since).toISOString(),
      };
    } catch (error) {
      console.error('Incremental backup failed:', error);
      return {
        success: false,
        error: String(error),
        duration: Date.now() - backupStartTime,
      };
    }
  },
});

/**
 * バックアップデータ整合性チェック
 *
 * @description バックアップデータのチェックサムを検証し、データの整合性を確認します。
 * バックアップの復元前やデータ転送後の検証に使用し、データ破損を検出します。
 *
 * @action
 * @param {Object} args - 整合性チェックパラメータ
 * @param {any} args.backupData - 検証対象のバックアップデータ
 * @param {string} args.expectedChecksum - 期待されるチェックサム値
 * @returns {Promise<Object>} 整合性チェック結果
 * @returns {boolean} returns.isValid - データが有効かどうか
 * @returns {string} returns.expectedChecksum - 期待されたチェックサム
 * @returns {string} [returns.actualChecksum] - 実際のチェックサム（成功時）
 * @returns {number} returns.timestamp - チェック実行時刻
 * @returns {string} [returns.error] - エラーメッセージ（失敗時）
 * @example
 * ```typescript
 * const verification = await verifyBackupIntegrity({
 *   backupData: restoredData,
 *   expectedChecksum: originalChecksum
 * });
 *
 * if (verification.isValid) {
 *   console.log('Backup data integrity verified');
 * } else {
 *   console.error('Data corruption detected!');
 * }
 * ```
 * @since 1.0.0
 */
export const verifyBackupIntegrity = action({
  args: {
    backupData: v.any(),
    expectedChecksum: v.string(),
  },
  handler: async (ctx, { backupData, expectedChecksum }) => {
    try {
      const actualChecksum = generateChecksum(JSON.stringify(backupData));
      const isValid = actualChecksum === expectedChecksum;

      if (!isValid) {
        console.error(
          `Backup integrity check failed. Expected: ${expectedChecksum}, Actual: ${actualChecksum}`
        );
      }

      return {
        isValid,
        expectedChecksum,
        actualChecksum,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * バックアップイベントの監査ログ記録
 *
 * @description バックアップ関連のイベントを監査ログに記録します。
 * バックアップの実行履歴、成功・失敗の追跡、トラブルシューティング用の情報保存を行います。
 *
 * @mutation
 * @param {Object} args - イベント記録パラメータ
 * @param {string} args.eventType - イベントタイプ
 * @param {any} args.metadata - イベントメタデータ
 * @param {string} args.details - イベントの詳細説明
 * @returns {Promise<Object>} 記録結果
 * @returns {boolean} returns.success - 記録成功の可否
 * @returns {string} [returns.error] - エラーメッセージ（失敗時）
 * @example
 * ```typescript
 * await recordBackupEvent({
 *   eventType: 'backup_started',
 *   metadata: { timestamp: Date.now(), type: 'full' },
 *   details: 'Full backup process initiated by admin'
 * });
 * ```
 * @since 1.0.0
 */
export const recordBackupEvent = internalMutation({
  args: {
    eventType: v.string(),
    metadata: v.any(),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    // システム用の組織とユーザーを取得
    const systemOrg = await ctx.db.query('orgs').first();
    const systemUser = await ctx.db.query('userProfiles').first();

    if (!systemOrg || !systemUser) {
      console.warn('No system org or user found for backup logging');
      return { success: false, error: 'System entities not found' };
    }

    await ctx.db.insert('audit_logs', {
      actor_id: systemUser._id,
      action: args.eventType,
      payload: {
        metadata: args.metadata,
        details: args.details,
        timestamp: Date.now(),
      },
      created_at: Date.now(),
      org_id: systemOrg._id,
    });

    return { success: true };
  },
});
