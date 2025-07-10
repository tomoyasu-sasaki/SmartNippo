/**
 * Convex API - 統合エクスポートファイル
 *
 * このファイルはConvexバックエンドの全機能を機能別に整理してエクスポートします。
 * 各機能は論理的にグループ化され、適切にコメント付けされています。
 */

// ============================================================================
// 🗄️ データベーススキーマ
// ============================================================================
export { default as schema } from './schema';

// ============================================================================
// 👤 ユーザー管理
// ============================================================================
// ユーザープロファイル操作
export { deleteProfile, store } from './users/mutations';

// ユーザー情報取得
export { current, getProfileHistory } from './users/queries';

// ============================================================================
// 📋 レポート管理
// ============================================================================
// レポート基本操作
export {
  approveReport,
  createReport,
  deleteReport,
  rejectReport,
  restoreReport,
  updateReport,
} from './reports/mutations';

// レポートコメント機能
export { addComment, deleteComment, updateComment } from './reports/comments';

// レポート取得・検索
export {
  getMyReports,
  getReportDetail,
  getReportForEdit,
  listReports,
  searchReports,
} from './reports/queries';

// ダッシュボード機能
export { getMyDashboardData } from './reports/dashboard';

// ============================================================================
// 🏢 組織管理
// ============================================================================
// 組織の基本操作
export { deleteOrganization, upsertOrganization } from './organizations/mutations';

// ============================================================================
// ✅ バリデーション
// ============================================================================
// 共通バリデーション型と関数
export type { ValidationError, ValidationResult } from './validation/common';

// 組織バリデーション
export { validateOrganization } from './validation/organization';

// ユーザーバリデーション
export { validateUserProfile } from './validation/user';

// レポートバリデーション
export { getValidationStats, logValidationError, validateReport } from './validation/report';

// ============================================================================
// 💾 バックアップ機能
// ============================================================================
// バックアップ設定と型
export { BACKUP_CONFIG } from './backup/config';
export type { BackupMetadata } from './backup/config';

// バックアップ実行機能
export {
  createFullBackup,
  createIncrementalBackup,
  recordBackupEvent,
  verifyBackupIntegrity,
} from './backup/actions';

// バックアップ情報取得
export { getBackupHistory, getBackupStatistics, getRestoreGuide } from './backup/queries';

// ============================================================================
// 🔄 データベース移行
// ============================================================================
export * from './migrations/migrations';

// ============================================================================
// 📦 スキーマバージョニング
// ============================================================================
export * from './schema_versioning/schema_versioning';

// ============================================================================
// 📂 プロジェクト & 作業区分管理
// ============================================================================
export { createProject, deleteProject, updateProject } from './projects/mutations';

export { listProjects } from './projects/queries';

export {
  createWorkCategory,
  deleteWorkCategory,
  updateWorkCategory,
} from './workCategories/mutations';

export { listWorkCategories } from './workCategories/queries';

export * from './reports/actions';

export * from './workItems/mutations';
export { listWorkItemsForReport } from './workItems/queries';
