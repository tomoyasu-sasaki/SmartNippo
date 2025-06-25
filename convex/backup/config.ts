/**
 * @fileoverview バックアップ機能の設定ファイル
 *
 * @description バックアップシステムの動作を制御する設定定数とメタデータ型定義を提供します。
 * バックアップの保持期間、実行間隔、バッチサイズなどの重要なパラメータを管理します。
 *
 * @since 1.0.0
 */

/**
 * バックアップシステムの基本設定
 *
 * @description バックアップの動作を制御する設定値を定義します。
 * システム全体のバックアップポリシーを一元管理し、一貫した動作を保証します。
 *
 * @constant
 * @readonly
 * @example
 * ```typescript
 * import { BACKUP_CONFIG } from './config';
 *
 * // バックアップ間隔を取得
 * const interval = BACKUP_CONFIG.BACKUP_INTERVAL_HOURS;
 * console.log(`バックアップは${interval}時間ごとに実行されます`);
 * ```
 * @since 1.0.0
 */
export const BACKUP_CONFIG = {
  /** 保持するバックアップの最大数（日数分） */
  MAX_BACKUPS_RETAINED: 30, // 30日分のバックアップを保持
  /** バックアップ実行間隔（時間） */
  BACKUP_INTERVAL_HOURS: 24, // 24時間ごとにバックアップ
  /** 一度に処理するドキュメント数 */
  EXPORT_BATCH_SIZE: 1000, // 一度に処理するドキュメント数
  /** データ保持ポリシー期間（日数） */
  RETENTION_POLICY_DAYS: 90, // 90日後に自動削除
} as const;

/**
 * バックアップのメタデータ情報
 *
 * @description バックアップファイルに関連する詳細情報を格納するインターフェース。
 * バックアップの作成時刻、含まれるテーブル情報、データサイズ、整合性チェック用のチェックサムなどを管理します。
 *
 * @interface
 * @example
 * ```typescript
 * const metadata: BackupMetadata = {
 *   version: 1,
 *   timestamp: Date.now(),
 *   description: "Daily backup",
 *   tables: [
 *     { name: "users", documentCount: 100, size: 50000 }
 *   ],
 *   totalDocuments: 100,
 *   totalSize: 50000,
 *   checksum: "abc123"
 * };
 * ```
 * @since 1.0.0
 */
export interface BackupMetadata {
  /** バックアップ形式のバージョン */
  version: number;
  /** バックアップ作成時刻（UNIX timestamp） */
  timestamp: number;
  /** バックアップの説明文 */
  description: string;
  /** バックアップに含まれるテーブル情報の配列 */
  tables: {
    /** テーブル名 */
    name: string;
    /** ドキュメント数 */
    documentCount: number;
    /** データサイズ（バイト） */
    size: number;
  }[];
  /** 総ドキュメント数 */
  totalDocuments: number;
  /** 総データサイズ（バイト） */
  totalSize: number;
  /** データ整合性チェック用のチェックサム（オプション） */
  checksum?: string;
}
