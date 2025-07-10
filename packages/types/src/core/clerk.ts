/**
 * @fileoverview Clerk関連の型定義
 */

import type { ClerkPublicMetadata, ClerkUnsafeMetadata, UserRole } from '@smartnippo/lib';

// Re-export types from lib
export type {
  ClerkPublicMetadata,
  ClerkPublicMetadataUpdate,
  ClerkUnsafeMetadata,
  ClerkUnsafeMetadataUpdate,
} from '@smartnippo/lib';

/**
 * Clerkユーザーオブジェクトの拡張型
 * 型安全なメタデータアクセスのため
 */
export interface ClerkUserWithTypedMetadata {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verified: boolean;
    primary: boolean;
  }>;
  imageUrl: string;
  unsafeMetadata: ClerkUnsafeMetadata;
  publicMetadata: ClerkPublicMetadata;
  createdAt: number;
  updatedAt: number;
}

/**
 * マイグレーション用の型定義
 */
export interface UserProfileMigrationData {
  clerkId: string;
  dataToMigrate: {
    name?: string;
    avatarUrl?: string;
    socialLinks?: Record<string, string>;
    privacySettings?: Record<string, string>;
    role?: UserRole;
  };
}

/**
 * Webhookペイロードの型定義（部分的）
 */
export interface ClerkWebhookUserData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: Array<{
    email_address: string;
    id: string;
  }>;
  image_url?: string;
  public_metadata?: unknown;
  unsafe_metadata?: unknown;
  created_at: number;
  updated_at: number;
}
