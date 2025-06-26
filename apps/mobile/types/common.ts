// 共通の基本型定義

import type { Report, UserProfile } from './index';

// 優先度の型定義（Convexスキーマから派生）
export type Priority = NonNullable<Report['tasks'][number]['priority']>;

// 難易度の型定義（Convexスキーマから派生）
export type Difficulty = NonNullable<Report['metadata']['difficulty']>;

// レポートステータスの型定義（Convexスキーマから派生）
export type ReportStatus = Report['status'];

// ユーザーロールの型定義（Convexスキーマから派生）
export type UserRole = UserProfile['role'];

// ムードの型定義（Convexスキーマから派生）
export type Mood = NonNullable<Report['metadata']['mood']>;

// プライバシー設定レベルの型定義（Convexスキーマから派生）
export type PrivacyLevel = NonNullable<UserProfile['privacySettings']>[keyof NonNullable<
  UserProfile['privacySettings']
>];

// ネットワーク接続状態の型定義
export type NetworkStatus = boolean | null;

// 画像結果の型定義
export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  fileName?: string;
}

// 基本的なエラー型
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

// ローディング状態の型定義
export interface LoadingState {
  isLoading: boolean;
  error?: AppError | null;
}

// ページネーション関連の型定義
export interface PaginationInfo {
  hasMore: boolean;
  cursor?: string | null;
  total?: number;
}

// 基本的なAPIレスポンス型
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
}
