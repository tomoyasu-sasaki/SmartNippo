/**
 * 型定義のメインエクスポートファイル
 *
 * Webアプリケーション全体で使用する型定義を集約
 */

// Convex関連の型定義
export * from './convex';

// コンポーネント関連の型定義
export * from './components';

// Convexの自動生成型の再エクスポート
export type { api, internal } from 'convex/_generated/api';
export type { DataModel, Doc, Id } from 'convex/_generated/dataModel';

// ========================================
// アプリケーション全体で使用する汎用型定義
// ========================================

/**
 * 非同期処理の結果型
 */
export type AsyncResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * ページメタデータ
 */
export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

/**
 * APIレスポンスの共通型
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: number;
    version?: string;
  };
}

/**
 * フォームの送信結果
 */
export interface FormSubmitResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * Convex Mutationのオプション
 */
export interface MutationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
}

/**
 * ローカルストレージのキー
 */
export const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
  REPORT_DRAFT: 'report-draft',
  USER_PREFERENCES: 'user-preferences',
} as const;

/**
 * セッションストレージのキー
 */
export const SESSION_STORAGE_KEYS = {
  RETURN_URL: 'return-url',
  FORM_DATA: 'form-data',
} as const;

/**
 * 環境変数の型定義
 */
export interface EnvironmentVariables {
  NEXT_PUBLIC_CONVEX_URL: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
}

// ========================================
// ユーティリティ型定義
// ========================================

/**
 * Nullable型
 */
export type Nullable<T> = T | null;

/**
 * Optional型（undefinedを許可）
 */
export type Optional<T> = T | undefined;

/**
 * DeepPartial型（ネストされたオブジェクトも部分的に）
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * DeepReadonly型（ネストされたオブジェクトも読み取り専用に）
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 配列の要素型を取得
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Promiseの解決値の型を取得
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : never;

/**
 * オブジェクトのキーをUnion型として取得
 */
export type KeysOf<T> = keyof T;

/**
 * オブジェクトの値をUnion型として取得
 */
export type ValuesOf<T> = T[keyof T];

/**
 * 特定のキーを除外した型
 */
export type ExcludeKeys<T, K extends keyof T> = Omit<T, K>;

/**
 * 特定のキーのみを含む型
 */
export type IncludeKeys<T, K extends keyof T> = Pick<T, K>;

// ========================================
// 型ガード関数のユーティリティ
// ========================================

/**
 * null/undefinedでないことを確認する型ガード
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 配列であることを確認する型ガード
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 文字列であることを確認する型ガード
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 数値であることを確認する型ガード
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * オブジェクトであることを確認する型ガード
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * エラーオブジェクトであることを確認する型ガード
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Promiseであることを確認する型ガード
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}
