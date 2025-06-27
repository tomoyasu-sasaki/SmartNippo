// プロフィール関連の型定義

import type { Doc, Id } from 'convex/_generated/dataModel';

// Convexのスキーマから型を派生
export type UserProfile = Doc<'userProfiles'>;
export type UserId = Id<'userProfiles'>;

// プロフィールフォームデータの型定義
export interface ProfileFormData {
  name: string;
  avatarUrl?: string;
  avatarStorageId?: Id<'_storage'>;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };
  privacySettings?: {
    profile?: 'public' | 'organization' | 'team' | 'private';
    email?: 'public' | 'organization' | 'team' | 'private';
    socialLinks?: 'public' | 'organization' | 'team' | 'private';
    reports?: 'public' | 'organization' | 'team' | 'private';
    avatar?: 'public' | 'organization' | 'team' | 'private';
  };
}

// プロフィール更新リクエストの型定義
export interface ProfileUpdateRequest {
  name: string;
  avatarUrl?: string;
  avatarStorageId?: Id<'_storage'>;
  socialLinks?: UserProfile['socialLinks'];
  privacySettings?: UserProfile['privacySettings'];
  _version: number; // 楽観的ロック用（Convexはnumber使用）
}

// ソーシャルリンクエディターのProps型
export interface SocialLinksEditorProps {
  socialLinks: UserProfile['socialLinks'];
  onChange: (links: NonNullable<UserProfile['socialLinks']>) => void;
}

// プライバシー設定エディターのProps型
export interface PrivacySettingsEditorProps {
  privacySettings: UserProfile['privacySettings'];
  onChange: (settings: NonNullable<UserProfile['privacySettings']>) => void;
}

// プライバシー設定オプションの型定義
export interface PrivacyOption {
  key: string;
  label: string;
}

// アバターアップロード結果の型定義
export interface AvatarUploadResult {
  url?: string;
  storageId: string;
  fileSize: number;
  fileType: string;
  fileName?: string;
}
