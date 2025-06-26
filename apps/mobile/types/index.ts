// 型定義のメインエクスポートファイル

// Convex生成型のインポート
import type { api } from 'convex/_generated/api';
import type { Doc, Id, TableNames } from 'convex/_generated/dataModel';

// Convex型の再エクスポート
export { api };
export type { Doc, Id, TableNames };

// テーブル固有の型エイリアス
export type Report = Doc<'reports'>;
export type UserProfile = Doc<'userProfiles'>;
export type Comment = Doc<'comments'>;
export type Approval = Doc<'approvals'>;
export type Organization = Doc<'orgs'>;

// ID型エイリアス
export type ReportId = Id<'reports'>;
export type UserId = Id<'userProfiles'>;
export type CommentId = Id<'comments'>;
export type OrgId = Id<'orgs'>;

// 共通型定義のエクスポート
export * from './common';

// レポート関連型定義のエクスポート
export * from './reports';

// プロフィール関連型定義のエクスポート
export * from './profile';

// コンポーネント関連型定義のエクスポート
export * from './components';

// ナビゲーション関連型定義のエクスポート
export * from './navigation';

// 便利な型エイリアス
export type Timestamp = number; // Convexはnumberを使用
export type Email = string;
export type URL = string;

// ユーティリティ型定義
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 型ガード関数の型定義
export type TypeGuard<T> = (value: unknown) => value is T;

// 非同期操作の結果型
export type AsyncResult<T, E = Error> = Promise<
  { success: true; data: T } | { success: false; error: E }
>;

// フォームフィールドの型定義
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
}

// フォーム状態の型定義
export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}
