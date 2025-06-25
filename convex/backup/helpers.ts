/**
 * @fileoverview バックアップ処理ヘルパー関数
 *
 * @description バックアップ作成時に使用するデータ収集、チェックサム生成、
 * 増分データ抽出などのヘルパー関数を提供します。
 *
 * @since 1.0.0
 */

/**
 * 全テーブルデータの収集
 *
 * @description アプリケーションの全テーブルからデータを収集し、
 * バックアップ用のデータセットを作成します。削除されたレコードの
 * 取り扱いもオプションで制御できます。
 *
 * @async
 * @function
 * @param {any} ctx - Convex context オブジェクト
 * @param {boolean} includeDeleted - 削除されたレコードを含めるかどうか
 * @returns {Promise<Record<string, any[]>>} テーブル名をキーとするデータマップ
 * @example
 * ```typescript
 * const allData = await collectAllTableData(ctx, false);
 * console.log('Collected tables:', Object.keys(allData));
 * console.log('Total records:', Object.values(allData).flat().length);
 * ```
 * @since 1.0.0
 */
export async function collectAllTableData(ctx: any, includeDeleted: boolean) {
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

/**
 * データ整合性チェック用チェックサム生成
 *
 * @description 文字列データからハッシュ値を生成し、バックアップデータの
 * 整合性確認に使用します。簡易的なハッシュ関数を使用しているため、
 * プロダクション環境ではより強力なハッシュアルゴリズムの採用を推奨します。
 *
 * @function
 * @param {string} data - ハッシュ対象の文字列データ
 * @returns {string} 生成されたチェックサム（16進数文字列）
 * @example
 * ```typescript
 * const data = JSON.stringify(backupData);
 * const checksum = generateChecksum(data);
 * console.log('Data checksum:', checksum);
 * ```
 * @since 1.0.0
 */
export function generateChecksum(data: string): string {
  // シンプルなハッシュ関数（実際のプロダクションではより強力なものを使用）
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(16);
}

/**
 * 増分バックアップ用データ収集
 *
 * @description 指定した時刻以降に更新されたデータのみを収集し、
 * 増分バックアップ用のデータセットを作成します。効率的なバックアップと
 * ストレージ容量の節約を実現します。
 *
 * @async
 * @function
 * @param {any} ctx - Convex context オブジェクト
 * @param {number} since - 基準時刻（UNIX timestamp）
 * @returns {Promise<Record<string, any[]>>} 変更されたデータのマップ
 * @example
 * ```typescript
 * const yesterday = Date.now() - 24 * 60 * 60 * 1000;
 * const incrementalData = await collectIncrementalData(ctx, yesterday);
 * console.log('Changed records:', Object.values(incrementalData).flat().length);
 * ```
 * @since 1.0.0
 */
export async function collectIncrementalData(ctx: any, since: number) {
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
