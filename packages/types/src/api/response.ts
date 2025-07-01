// ========================================
// API response types
// ========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ページネーション関連の型定義
export interface PaginationInfo {
  hasMore: boolean;
  cursor?: string | null;
  total?: number;
}

// 基本的なAPIレスポンス型
export interface ApiResponseWithPagination<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
}

// ========================================
// State management types
// ========================================

export interface LoadingState {
  isLoading: boolean;
  error?: AppError | null;
}

export interface FilterState {
  status?: ReportStatus;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Import required types
import type { ReportStatus } from '../core/enums';
import type { AppError } from './errors';
