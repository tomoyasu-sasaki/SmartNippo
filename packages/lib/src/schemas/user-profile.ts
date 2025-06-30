import { z } from 'zod';

// ユーザーロールの型定義
export const UserRole = z.enum(['user', 'manager', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

// ソーシャルリンクの型定義
export const SocialLinksSchema = z.record(z.string().url());
export type SocialLinks = z.infer<typeof SocialLinksSchema>;

// プライバシー設定の型定義
export const PrivacyLevel = z.enum(['private', 'organization', 'public']);
export type PrivacyLevel = z.infer<typeof PrivacyLevel>;

export const PrivacySettingsSchema = z.object({
  profile: PrivacyLevel.optional(),
  email: PrivacyLevel.optional(),
  socialLinks: PrivacyLevel.optional(),
  reports: PrivacyLevel.optional(),
});
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

// ユーザープロフィールスキーマ
export const UserProfileSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: UserRole,
  orgId: z.string().optional(),
  pushToken: z.string().optional(),
  socialLinks: SocialLinksSchema.optional(),
  privacySettings: PrivacySettingsSchema.optional(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// プロフィールフォーム用の型定義
export const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  avatarUrl: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

// プロフィール更新用のスキーマ
export const ProfileUpdateSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  socialLinks: SocialLinksSchema.optional(),
  privacySettings: PrivacySettingsSchema.optional(),
  _version: z.number(),
});

export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;
