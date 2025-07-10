/**
 * @fileoverview 統合ユーザープロフィール型定義
 * ClerkとConvexの情報を統合した型定義
 */

import type { PrivacySettings, SocialLinks, UserRole } from '@smartnippo/lib';

/**
 * 統合ユーザープロフィール
 * ClerkとConvexの情報を組み合わせた完全なプロフィール情報
 */
export interface UnifiedUserProfile {
  // ========== 識別情報 ==========
  /** ClerkユーザーID（プライマリキー） */
  id: string;

  /** Convex内部ID（レガシー用） */
  convexId?: string;

  // ========== 基本情報（Clerk標準フィールド） ==========
  /** 名 */
  firstName: string | null;

  /** 姓 */
  lastName: string | null;

  /** フルネーム（表示用） */
  fullName: string | null;

  /** プライマリメールアドレス */
  emailAddress: string | null;

  /** 確認済みメールアドレスのリスト */
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verified: boolean;
    primary: boolean;
  }>;

  /** プロフィール画像URL */
  imageUrl: string;

  /** 電話番号（オプション） */
  phoneNumber: string | null;

  // ========== カスタム情報（unsafeMetadata） ==========
  /** ソーシャルメディアリンク */
  socialLinks?: SocialLinks;

  /** プライバシー設定 */
  privacySettings?: PrivacySettings;

  /** ユーザー設定 */
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat?: '12h' | '24h';
    weekStartsOn?: 'sunday' | 'monday';
  };

  /** 通知設定 */
  notifications?: {
    email?: {
      reportSubmitted?: boolean;
      reportApproved?: boolean;
      reportRejected?: boolean;
      commentReceived?: boolean;
      weeklyDigest?: boolean;
    };
    push?: {
      reportReminder?: boolean;
      approvalRequired?: boolean;
      commentReceived?: boolean;
    };
  };

  // ========== システム情報（publicMetadata） ==========
  /** ユーザーロール */
  role: UserRole;

  /** 権限リスト */
  permissions?: string[];

  /** 有効な機能フラグ */
  features?: string[];

  /** アカウント状態 */
  accountStatus?: 'active' | 'suspended' | 'deactivated';

  /** 最終アクティブ日時 */
  lastActiveAt?: Date;

  // ========== 組織情報（Convex管理） ==========
  /** 所属組織ID */
  orgId?: string;

  /** 組織情報（リレーション） */
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };

  /** チームID（複数所属可能） */
  teamIds?: string[];

  // ========== アプリケーション固有（Convex管理） ==========
  /** プッシュ通知トークン */
  pushToken?: string;

  /** Convexストレージのアバター参照 */
  avatarStorageId?: string;

  // ========== 統計情報 ==========
  /** 日報統計 */
  stats?: {
    totalReports: number;
    lastReportDate?: Date;
    averageWorkingHours?: number;
    completionRate?: number;
  };

  // ========== タイムスタンプ ==========
  /** アカウント作成日時 */
  createdAt: Date;

  /** 最終更新日時 */
  updatedAt: Date;

  /** Convexプロフィール作成日時 */
  convexCreatedAt?: Date;

  /** Convexプロフィール更新日時 */
  convexUpdatedAt?: Date;
}

/**
 * プロフィール表示用の型（プライバシー設定適用後）
 */
export interface PublicUserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailAddress?: string;
  imageUrl?: string;
  socialLinks?: Partial<SocialLinks>;
  role: UserRole;
  organization?: {
    name: string;
    slug: string;
  };
  stats?: {
    totalReports: number;
    lastReportDate?: Date;
  };
}

/**
 * プロフィール作成時の入力型
 */
export interface CreateUserProfileInput {
  clerkId: string;
  orgId?: string;
  role?: UserRole;
  pushToken?: string;
}

/**
 * プロフィール更新時の入力型
 */
export interface UpdateUserProfileInput {
  // Clerk標準フィールドの更新
  firstName?: string;
  lastName?: string;
  imageUrl?: string;

  // メタデータの更新
  socialLinks?: Partial<SocialLinks>;
  privacySettings?: Partial<PrivacySettings>;
  preferences?: Partial<UnifiedUserProfile['preferences']>;
  notifications?: Partial<UnifiedUserProfile['notifications']>;

  // システム情報の更新（バックエンドのみ）
  role?: UserRole;
  permissions?: string[];
  features?: string[];

  // Convex固有の更新
  pushToken?: string;
}

/**
 * ユーザー関係性の型定義
 */
export type UserRelationType = 'self' | 'team' | 'organization' | 'public';

/**
 * プロフィール取得オプション
 */
export interface GetProfileOptions {
  /** 取得するユーザーID */
  userId: string;

  /** 閲覧者のID（プライバシー設定適用用） */
  viewerId?: string;

  /** 統計情報を含めるか */
  includeStats?: boolean;

  /** 組織情報を含めるか */
  includeOrganization?: boolean;

  /** プライバシー設定を適用するか */
  applyPrivacy?: boolean;
}

/**
 * プロフィール一覧取得オプション
 */
export interface ListProfilesOptions {
  /** 組織IDでフィルタ */
  orgId?: string;

  /** ロールでフィルタ */
  role?: UserRole;

  /** アクティブユーザーのみ */
  activeOnly?: boolean;

  /** ページネーション */
  limit?: number;
  cursor?: string;

  /** ソート順 */
  sortBy?: 'name' | 'createdAt' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
}
