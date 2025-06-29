/**
 * Convex関連の型定義
 *
 * Convexの自動生成型をベースに、アプリケーション固有の型定義を追加
 */

import type { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';

// ========================================
// テーブル別の型定義
// ========================================

/**
 * 組織型定義
 */
export type Organization = Doc<'orgs'>;
export type OrganizationId = Id<'orgs'>;
export type OrganizationPlan = 'free' | 'pro' | 'enterprise';

/**
 * ユーザープロファイル型定義
 */
export type UserProfile = Doc<'userProfiles'>;
export type UserProfileId = Id<'userProfiles'>;
export type UserRole = 'user' | 'manager' | 'admin';

/**
 * プライバシー設定の型定義
 */
export type PrivacyLevel = 'public' | 'organization' | 'team' | 'private';

export interface PrivacySettings {
  profile?: PrivacyLevel;
  email?: PrivacyLevel;
  socialLinks?: PrivacyLevel;
  reports?: PrivacyLevel;
  avatar?: PrivacyLevel;
}

/**
 * ソーシャルリンクの型定義
 */
export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

/**
 * 日報型定義
 */
export type Report = Doc<'reports'>;
export type ReportId = Id<'reports'>;
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type AISummaryStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * タスク型定義
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  actualHours?: number;
  category?: string;
}

/**
 * 添付ファイル型定義
 */
export interface Attachment {
  id: string;
  name: string;
  url?: string;
  storageId?: Id<'_storage'>;
  size: number;
  type: string; // MIME type
  uploadedAt: number;
  description?: string;
}

/**
 * レポートメタデータ型定義
 */
export interface ReportMetadata {
  mood?: 'positive' | 'neutral' | 'negative';
  workingHours?: number;
  location?: string;
  tags?: string[];
  version?: number;
  previousReportId?: ReportId;
  template?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  achievements?: string[];
  challenges?: string[];
  learnings?: string[];
  nextActionItems?: string[];
}

/**
 * 編集履歴型定義
 */
export interface EditHistory {
  editedAt: number;
  editorId: UserProfileId;
  changes: string;
}

/**
 * コメント型定義
 */
export type Comment = Doc<'comments'>;
export type CommentId = Id<'comments'>;
export type CommentType = 'user' | 'system' | 'ai';

/**
 * 承認型定義
 */
export type Approval = Doc<'approvals'>;
export type ApprovalId = Id<'approvals'>;

/**
 * 監査ログ型定義
 */
export type AuditLog = Doc<'audit_logs'>;
export type AuditLogId = Id<'audit_logs'>;

/**
 * スキーマバージョン型定義
 */
export type SchemaVersion = Doc<'schema_versions'>;

// ========================================
// API関数の戻り値型定義
// ========================================

/**
 * 現在のユーザー情報
 */
export type CurrentUserInfo = FunctionReturnType<typeof api.index.current>;

/**
 * レポート一覧のクエリ結果
 */
export type ReportsQueryResult = FunctionReturnType<typeof api.reports.queries.listReports>;

/**
 * レポート詳細のクエリ結果
 */
export type ReportDetailResult = FunctionReturnType<typeof api.reports.queries.getReportDetail>;

/**
 * ダッシュボード統計情報
 */
export type DashboardStats = FunctionReturnType<typeof api.reports.dashboard.getDashboardStats>;

// ========================================
// フォーム・入力関連の型定義
// ========================================

/**
 * レポート作成フォームの値
 */
export interface ReportFormValues {
  reportDate: string;
  title: string;
  content: string;
  tasks: Task[];
  metadata?: Partial<ReportMetadata>;
}

/**
 * レポート更新フォームの値
 */
export interface ReportUpdateFormValues extends ReportFormValues {
  status?: ReportStatus;
}

/**
 * プロフィール更新フォームの値
 */
export interface ProfileFormValues {
  name: string;
  avatarUrl?: string;
  avatarStorageId?: Id<'_storage'>;
  socialLinks?: Partial<SocialLinks>;
  privacySettings?: Partial<PrivacySettings>;
}

/**
 * コメント作成フォームの値
 */
export interface CommentFormValues {
  content: string;
  type?: CommentType;
}

// ========================================
// フィルター・検索関連の型定義
// ========================================

/**
 * レポートフィルター条件
 */
export interface ReportFilterOptions {
  status?: ReportStatus | null;
  authorId?: UserProfileId | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  sortBy?: 'reportDate' | 'created_at' | 'updated_at' | 'submittedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total?: number;
}

// ========================================
// エラー・レスポンス関連の型定義
// ========================================

/**
 * APIエラーレスポンス
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: string;
  message: string;
}

// ========================================
// ユーティリティ型定義
// ========================================

/**
 * 部分的な更新用の型
 */
export type PartialUpdate<T> = Partial<Omit<T, '_id' | '_creationTime'>>;

/**
 * 作成用の型（システムフィールドを除外）
 */
export type CreateInput<T> = Omit<T, '_id' | '_creationTime'>;

/**
 * 日付範囲の型
 */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * ソート条件の型
 */
export interface SortOption<T extends string> {
  field: T;
  order: 'asc' | 'desc';
}

// ========================================
// 型ガード関数
// ========================================

/**
 * ユーザーロールの型ガード
 */
export function isManager(role: UserRole): role is 'manager' | 'admin' {
  return role === 'manager' || role === 'admin';
}

/**
 * 管理者ロールの型ガード
 */
export function isAdmin(role: UserRole): role is 'admin' {
  return role === 'admin';
}

/**
 * レポートステータスの型ガード
 */
export function isApprovedReport(status: ReportStatus): status is 'approved' {
  return status === 'approved';
}

/**
 * AIコメントの型ガード
 */
export function isAIComment(type: CommentType): type is 'ai' {
  return type === 'ai';
}

// ========================================
// 定数の型定義
// ========================================

/**
 * レポートステータスのラベル
 */
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: '下書き',
  submitted: '提出済み',
  approved: '承認済み',
  rejected: '却下',
} as const;

/**
 * ユーザーロールのラベル
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: 'ユーザー',
  manager: 'マネージャー',
  admin: '管理者',
} as const;

/**
 * タスク優先度のラベル
 */
export const TASK_PRIORITY_LABELS: Record<NonNullable<Task['priority']>, string> = {
  low: '低',
  medium: '中',
  high: '高',
} as const;

/**
 * 難易度のラベル
 */
export const DIFFICULTY_LABELS: Record<NonNullable<ReportMetadata['difficulty']>, string> = {
  easy: '簡単',
  medium: '普通',
  hard: '難しい',
} as const;
