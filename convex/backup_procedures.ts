import { v } from 'convex/values';
import { api } from './_generated/api';
import { action, mutation, query } from './_generated/server';

// バックアップ設定
export const BACKUP_CONFIG = {
  MAX_BACKUPS_RETAINED: 30, // 30日分のバックアップを保持
  BACKUP_INTERVAL_HOURS: 24, // 24時間ごとにバックアップ
  EXPORT_BATCH_SIZE: 1000, // 一度に処理するドキュメント数
  RETENTION_POLICY_DAYS: 90, // 90日後に自動削除
} as const;

// バックアップメタデータタイプ
interface BackupMetadata {
  version: number;
  timestamp: number;
  description: string;
  tables: {
    name: string;
    documentCount: number;
    size: number;
  }[];
  totalDocuments: number;
  totalSize: number;
  checksum?: string;
}

// 完全バックアップ作成
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
      await ctx.runMutation(api.backup_procedures.recordBackupEvent, {
        eventType: 'backup_started',
        metadata,
        details: 'Full backup initiated',
      });

      const backupEndTime = Date.now();
      const duration = backupEndTime - backupStartTime;

      console.log(`Backup completed in ${duration}ms`);

      // 完了記録
      await ctx.runMutation(api.backup_procedures.recordBackupEvent, {
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

      await ctx.runMutation(api.backup_procedures.recordBackupEvent, {
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

// データ収集ヘルパー関数
async function collectAllTableData(ctx: any, includeDeleted: boolean) {
  const tables = [
    'orgs',
    'userProfiles',
    'reports',
    'comments',
    'approvals',
    'audit_logs',
    'schema_versions',
  ];
  const backupData: Record<string, any[]> = {};

  for (const tableName of tables) {
    try {
      let documents = await ctx.db.query(tableName).collect();

      // 削除されたドキュメントをフィルタリング（必要に応じて）
      if (!includeDeleted && tableName === 'reports') {
        documents = documents.filter((doc: any) => !doc.isDeleted);
      }

      backupData[tableName] = documents;
      console.log(`Collected ${documents.length} documents from ${tableName}`);
    } catch (error) {
      console.error(`Failed to backup table ${tableName}:`, error);
      backupData[tableName] = [];
    }
  }

  return backupData;
}

// チェックサム生成
function generateChecksum(data: string): string {
  // シンプルなハッシュ関数（実際のプロダクションではより強力なものを使用）
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(16);
}

// 増分バックアップ作成
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

      await ctx.runMutation(api.backup_procedures.recordBackupEvent, {
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

// 増分データ収集
async function collectIncrementalData(ctx: any, since: number) {
  const tables = [
    'orgs',
    'userProfiles',
    'reports',
    'comments',
    'approvals',
    'audit_logs',
    'schema_versions',
  ];
  const incrementalData: Record<string, any[]> = {};

  for (const tableName of tables) {
    try {
      // 更新日時または作成日時でフィルタリング
      const documents = await ctx.db.query(tableName).collect();
      const changedDocs = documents.filter((doc: any) => {
        const lastModified = doc.updated_at ?? doc.created_at ?? doc._creationTime;
        return lastModified > since;
      });

      incrementalData[tableName] = changedDocs;
      console.log(
        `Found ${changedDocs.length} changed documents in ${tableName} since ${new Date(since).toISOString()}`
      );
    } catch (error) {
      console.error(`Failed to collect incremental data from ${tableName}:`, error);
      incrementalData[tableName] = [];
    }
  }

  return incrementalData;
}

// バックアップ履歴取得
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

// バックアップ統計
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

// バックアップイベント記録
export const recordBackupEvent = mutation({
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

// バックアップ整合性チェック
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

// 復旧手順ガイド取得
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
