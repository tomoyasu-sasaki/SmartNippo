/**
 * コンポーネント関連の型定義
 */

import type { ReactNode } from 'react';
import type { CommentType, ReportId, ReportStatus, Task, UserProfileId, UserRole } from './convex';

// ========================================
// レポート関連コンポーネントの型定義
// ========================================

/**
 * レポートエディターのProps
 */
export interface ReportEditorProps {
  reportId?: ReportId;
  initialData?: {
    reportDate?: Date;
    title?: string;
    content?: string;
    tasks?: Array<{
      id: string;
      title: string;
      completed: boolean;
      priority?: 'low' | 'medium' | 'high' | undefined;
      estimatedHours?: number | undefined;
      actualHours?: number | undefined;
      category?: string | undefined;
    }>;
  };
  expectedUpdatedAt?: number;
}

/**
 * レポート詳細のProps
 */
export interface ReportDetailProps {
  reportId: ReportId;
}

/**
 * レポートエディターラッパーのProps
 */
export interface ReportEditorWrapperProps {
  params: { id: ReportId };
}

/**
 * レポートカードのProps
 */
export interface ReportCardProps {
  report: {
    _id: ReportId;
    title: string;
    content: string;
    reportDate: string;
    status: ReportStatus;
    tasks: Task[];
    author?: {
      name: string;
    };
    created_at: number;
  };
  onClick?: () => void;
}

/**
 * レポートフィルターのProps
 */
export interface ReportFilterProps {
  onFilterChange: (filters: {
    status?: ReportStatus | null;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) => void;
  defaultValues?: {
    status?: ReportStatus | null;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
}

/**
 * タスクアイテムのProps
 */
export interface TaskItemProps {
  task: Task;
  onUpdate?: (task: Task) => void;
  onDelete?: () => void;
  readonly?: boolean;
}

/**
 * タスクリストのProps
 */
export interface TaskListProps {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  readonly?: boolean;
}

// ========================================
// プロフィール関連コンポーネントの型定義
// ========================================

/**
 * プロフィールフォームのProps
 */
export interface ProfileFormProps {
  userProfile: {
    _id: UserProfileId;
    name: string;
    avatarUrl?: string;
    socialLinks?: Record<string, string>;
    privacySettings?: Record<string, string>;
  };
  onSuccess?: () => void;
}

/**
 * アバターアップロードのProps
 */
export interface AvatarUploadProps {
  avatarUrl?: string;
  onUpload: (result: {
    url: string;
    storageId?: string;
    fileSize: number;
    fileType: string;
  }) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSize?: number;
  className?: string;
}

/**
 * ソーシャルリンクエディターのProps
 */
export interface SocialLinksEditorProps {
  links: Record<string, string>;
  onChange: (links: Record<string, string>) => void;
  disabled?: boolean;
}

/**
 * プライバシー設定エディターのProps
 */
export interface PrivacySettingsEditorProps {
  settings: Record<string, string>;
  onChange: (settings: Record<string, string>) => void;
  disabled?: boolean;
}

// ========================================
// ダッシュボード関連コンポーネントの型定義
// ========================================

/**
 * ダッシュボードコンテンツのProps
 */
export interface DashboardContentProps {
  userRole?: UserRole;
}

/**
 * 統計カードのProps
 */
export interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * レポートチャートのProps
 */
export interface ReportsChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
  height?: number;
}

// ========================================
// コメント関連コンポーネントの型定義
// ========================================

/**
 * コメントアイテムのProps
 */
export interface CommentItemProps {
  comment: {
    _id: string;
    content: string;
    type: CommentType;
    author?: {
      name: string;
      avatarUrl?: string;
    };
    created_at: number;
  };
}

/**
 * コメントフォームのProps
 */
export interface CommentFormProps {
  reportId: ReportId;
  onSuccess?: () => void;
}

/**
 * コメントリストのProps
 */
export interface CommentListProps {
  reportId: ReportId;
}

// ========================================
// レイアウト関連コンポーネントの型定義
// ========================================

/**
 * ヘッダーのProps
 */
export interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    role: UserRole;
  };
}

/**
 * ナビゲーションのProps
 */
export interface NavigationProps {
  currentPath: string;
  userRole?: UserRole;
}

/**
 * コンテナのProps
 */
export interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

// ========================================
// 共通UIコンポーネントの型定義
// ========================================

/**
 * ローディングスピナーのProps
 */
export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ローディング状態のProps
 */
export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ローディングオーバーレイのProps
 */
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  text?: string;
}

/**
 * エラー境界のProps
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

/**
 * 確認ダイアログのProps
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'default' | 'destructive';
}

/**
 * データテーブルのProps
 */
export interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    header: string;
    cell?: (value: T) => ReactNode;
    sortable?: boolean;
  }>;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * ページネーションのProps
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * 検索入力のProps
 */
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
}

/**
 * 日付ピッカーのProps
 */
export interface DatePickerProps {
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * 日付範囲ピッカーのProps
 */
export interface DateRangePickerProps {
  value?: {
    from: Date | string;
    to: Date | string;
  };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ========================================
// フォーム関連の型定義
// ========================================

/**
 * フォームフィールドのエラー
 */
export interface FormFieldError {
  message: string;
}

/**
 * フォームの状態
 */
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, FormFieldError>;
}

/**
 * フォームフィールドのProps（汎用）
 */
export interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: FormFieldError;
}
