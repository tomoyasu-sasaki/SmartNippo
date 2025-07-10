/**
 * @fileoverview スキーマ定義のエクスポート
 */

// 既存のスキーマ
export { ProfileUpdateSchema, UserProfileSchema, profileFormSchema } from './user-profile';

export type { ProfileFormData, ProfileUpdateData, UserProfile } from './user-profile';

// Clerkメタデータスキーマ
export {
  ClerkPublicMetadataSchema,
  ClerkPublicMetadataUpdateSchema,
  ClerkUnsafeMetadataSchema,
  ClerkUnsafeMetadataUpdateSchema,
  // マッピング定義
  ConvexToClerkMapping,
  PrivacySettingsSchema,
  // スキーマ
  SocialLinksSchema,
  parsePublicMetadata,
  // ヘルパー関数
  parseUnsafeMetadata,
} from './clerk-metadata';

export type {
  ClerkPublicMetadata,
  ClerkPublicMetadataUpdate,
  ClerkUnsafeMetadata,
  ClerkUnsafeMetadataUpdate,
  PrivacyLevel,
  PrivacySettings,
  SocialLinks,
  // 型定義
  SocialPlatform,
  UserRole,
} from './clerk-metadata';
