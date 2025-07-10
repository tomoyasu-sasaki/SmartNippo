import { z } from 'zod';

/**
 * Clerkメタデータスキーマ定義
 *
 * このファイルは、Clerkのユーザーメタデータ構造を定義します。
 * - unsafeMetadata: ユーザーが直接編集可能な情報
 * - publicMetadata: バックエンドからのみ更新可能な情報
 */

// ========== 共通の型定義 ==========

// ソーシャルプラットフォームの型定義
export const SocialPlatform = z.enum([
  'twitter',
  'linkedin',
  'github',
  'instagram',
  'facebook',
  'youtube',
  'website',
]);
export type SocialPlatform = z.infer<typeof SocialPlatform>;

// プライバシーレベルの型定義
export const PrivacyLevel = z.enum(['public', 'organization', 'team', 'private']);
export type PrivacyLevel = z.infer<typeof PrivacyLevel>;

// ユーザーロールの型定義
export const UserRole = z.enum(['user', 'manager', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

// ========== Unsafe Metadata (ユーザー編集可能) ==========

// ソーシャルリンクのスキーマ（より詳細なバリデーション付き）
export const SocialLinksSchema = z
  .object({
    twitter: z
      .string()
      .url()
      .regex(/^https:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/, 'Invalid Twitter/X URL')
      .optional(),
    linkedin: z
      .string()
      .url()
      .regex(
        /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+$/,
        'Invalid LinkedIn URL'
      )
      .optional(),
    github: z
      .string()
      .url()
      .regex(/^https:\/\/github\.com\/[a-zA-Z0-9-]+$/, 'Invalid GitHub URL')
      .optional(),
    instagram: z
      .string()
      .url()
      .regex(/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/, 'Invalid Instagram URL')
      .optional(),
    facebook: z
      .string()
      .url()
      .regex(/^https:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+$/, 'Invalid Facebook URL')
      .optional(),
    youtube: z
      .string()
      .url()
      .regex(
        /^https:\/\/(www\.)?youtube\.com\/(c|channel|user)\/[a-zA-Z0-9_-]+$/,
        'Invalid YouTube URL'
      )
      .optional(),
    website: z.string().url().max(255, 'URL must be less than 255 characters').optional(),
  })
  .partial()
  .refine((data) => Object.values(data).filter(Boolean).length <= 10, {
    message: 'Maximum 10 social links allowed',
  });

export type SocialLinks = z.infer<typeof SocialLinksSchema>;

// プライバシー設定のスキーマ（より詳細な構造）
export const PrivacySettingsSchema = z
  .object({
    // プロフィール表示設定
    profile: z
      .object({
        visibility: PrivacyLevel.default('organization'),
        showFullName: z.boolean().default(true),
        showEmail: z.boolean().default(false),
        showAvatar: z.boolean().default(true),
      })
      .optional(),

    // メールアドレス表示設定
    email: z
      .object({
        visibility: PrivacyLevel.default('private'),
        allowContactRequests: z.boolean().default(false),
      })
      .optional(),

    // ソーシャルリンク表示設定
    socialLinks: z
      .object({
        visibility: PrivacyLevel.default('organization'),
        // 個別のプラットフォームごとの表示設定
        platformVisibility: z.record(SocialPlatform, z.boolean()).optional(),
      })
      .optional(),

    // 日報表示設定
    reports: z
      .object({
        visibility: PrivacyLevel.default('organization'),
        showWorkDetails: z.boolean().default(true),
        showWorkingHours: z.boolean().default(true),
        showComments: z.boolean().default(true),
      })
      .optional(),

    // アバター表示設定
    avatar: z
      .object({
        visibility: PrivacyLevel.default('public'),
        allowDownload: z.boolean().default(false),
      })
      .optional(),
  })
  .partial();

export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

// Clerk unsafeMetadata のスキーマ
export const ClerkUnsafeMetadataSchema = z.object({
  socialLinks: SocialLinksSchema.optional(),
  privacySettings: PrivacySettingsSchema.optional(),
  // 将来的な拡張用
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z
        .string()
        .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code')
        .optional(),
      timezone: z
        .string()
        .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid timezone format')
        .optional(),
      dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
      timeFormat: z.enum(['12h', '24h']).optional(),
      weekStartsOn: z.enum(['sunday', 'monday']).optional(),
    })
    .optional(),

  // 通知設定
  notifications: z
    .object({
      email: z
        .object({
          reportSubmitted: z.boolean().optional().default(true),
          reportApproved: z.boolean().optional().default(true),
          reportRejected: z.boolean().optional().default(true),
          commentReceived: z.boolean().optional().default(true),
          weeklyDigest: z.boolean().optional().default(false),
        })
        .optional(),
      push: z
        .object({
          reportReminder: z.boolean().optional().default(true),
          approvalRequired: z.boolean().optional().default(true),
          commentReceived: z.boolean().optional().default(true),
        })
        .optional(),
    })
    .optional(),
});

export type ClerkUnsafeMetadata = z.infer<typeof ClerkUnsafeMetadataSchema>;

// ========== Public Metadata (バックエンドのみ更新可能) ==========

// Clerk publicMetadata のスキーマ
export const ClerkPublicMetadataSchema = z.object({
  role: UserRole.optional(),
  // 組織関連の情報はConvexに残すため、ここには含めない
  // 将来的な拡張用
  permissions: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  // 最終ログイン情報など
  lastActiveAt: z.number().optional(),
  // アカウントステータス
  accountStatus: z.enum(['active', 'suspended', 'deactivated']).optional(),
});

export type ClerkPublicMetadata = z.infer<typeof ClerkPublicMetadataSchema>;

// ========== ヘルパー関数 ==========

/**
 * Clerkの unsafeMetadata を安全にパースする
 */
export function parseUnsafeMetadata(metadata: unknown): ClerkUnsafeMetadata | null {
  const result = ClerkUnsafeMetadataSchema.safeParse(metadata);
  return result.success ? result.data : null;
}

/**
 * Clerkの publicMetadata を安全にパースする
 */
export function parsePublicMetadata(metadata: unknown): ClerkPublicMetadata | null {
  const result = ClerkPublicMetadataSchema.safeParse(metadata);
  return result.success ? result.data : null;
}

/**
 * 型ガード: ClerkUnsafeMetadataかどうかを判定
 */
export function isClerkUnsafeMetadata(value: unknown): value is ClerkUnsafeMetadata {
  return ClerkUnsafeMetadataSchema.safeParse(value).success;
}

/**
 * 型ガード: ClerkPublicMetadataかどうかを判定
 */
export function isClerkPublicMetadata(value: unknown): value is ClerkPublicMetadata {
  return ClerkPublicMetadataSchema.safeParse(value).success;
}

/**
 * Clerkの unsafeMetadata を安全にパースし、エラー情報も返す
 */
export function parseUnsafeMetadataWithErrors(metadata: unknown): {
  data: ClerkUnsafeMetadata | null;
  errors: z.ZodError | null;
} {
  const result = ClerkUnsafeMetadataSchema.safeParse(metadata);
  return {
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error,
  };
}

/**
 * Clerkの publicMetadata を安全にパースし、エラー情報も返す
 */
export function parsePublicMetadataWithErrors(metadata: unknown): {
  data: ClerkPublicMetadata | null;
  errors: z.ZodError | null;
} {
  const result = ClerkPublicMetadataSchema.safeParse(metadata);
  return {
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error,
  };
}

/**
 * メタデータの部分更新をマージする
 */
export function mergeUnsafeMetadata(
  existing: ClerkUnsafeMetadata | undefined,
  update: ClerkUnsafeMetadataUpdate
): ClerkUnsafeMetadata {
  const rawMerged = {
    ...(existing ?? {}),
    ...update,
    socialLinks: {
      ...(existing?.socialLinks ?? {}),
      ...(update.socialLinks ?? {}),
    },
    privacySettings: {
      ...(existing?.privacySettings ?? {}),
      ...(update.privacySettings ?? {}),
    },
    preferences: {
      ...(existing?.preferences ?? {}),
      ...(update.preferences ?? {}),
    },
    notifications: {
      ...(existing?.notifications ?? {}),
      ...(update.notifications ?? {}),
      email: {
        ...(existing?.notifications?.email ?? {}),
        ...(update.notifications?.email ?? {}),
      },
      push: {
        ...(existing?.notifications?.push ?? {}),
        ...(update.notifications?.push ?? {}),
      },
    },
  };

  // Zodスキーマでパースすることで、デフォルト値を適用し、完全なオブジェクトを生成する
  return ClerkUnsafeMetadataSchema.parse(rawMerged);
}

/**
 * unsafeMetadata の部分更新用スキーマ
 */
export const ClerkUnsafeMetadataUpdateSchema = ClerkUnsafeMetadataSchema.partial();
export type ClerkUnsafeMetadataUpdate = z.infer<typeof ClerkUnsafeMetadataUpdateSchema>;

/**
 * publicMetadata の部分更新用スキーマ
 */
export const ClerkPublicMetadataUpdateSchema = ClerkPublicMetadataSchema.partial();
export type ClerkPublicMetadataUpdate = z.infer<typeof ClerkPublicMetadataUpdateSchema>;

// ========== バリデーションヘルパー ==========

/**
 * ソーシャルリンクのURLを正規化する
 */
export function normalizeSocialUrl(platform: SocialPlatform, url: string): string {
  const trimmedUrl = url.trim();

  switch (platform) {
    case 'twitter':
      // x.com を twitter.com に統一
      return trimmedUrl.replace(/^https:\/\/x\.com/, 'https://twitter.com');
    case 'linkedin':
      // www.を追加
      return trimmedUrl.replace(/^https:\/\/linkedin\.com/, 'https://www.linkedin.com');
    default:
      return trimmedUrl;
  }
}

/**
 * プライバシーレベルに基づいてフィールドを表示するかどうかを判定
 */
export function shouldShowField(
  fieldPrivacy: PrivacyLevel | undefined,
  viewerRelation: 'self' | 'organization' | 'team' | 'public'
): boolean {
  const privacyLevel = fieldPrivacy ?? 'organization';

  const privacyHierarchy: Record<PrivacyLevel, number> = {
    public: 0,
    organization: 1,
    team: 2,
    private: 3,
  };

  const viewerHierarchy: Record<typeof viewerRelation, number> = {
    public: 0,
    organization: 1,
    team: 2,
    self: 3,
  };

  return viewerHierarchy[viewerRelation] >= privacyHierarchy[privacyLevel];
}

// ========== マイグレーション用マッピング ==========

/**
 * ConvexのuserProfilesからClerkメタデータへのマッピング定義
 */
export const ConvexToClerkMapping = {
  // unsafeMetadata へ移行するフィールド
  toUnsafeMetadata: ['socialLinks', 'privacySettings'] as const,
  // publicMetadata へ移行するフィールド
  toPublicMetadata: ['role'] as const,
  // Clerkの標準フィールドへ移行
  toClerkStandard: {
    name: 'firstName', // Clerkでは firstName/lastName に分割
    avatarUrl: 'imageUrl',
    email: 'emailAddress',
  } as const,
  // Convexに残すフィールド
  remainInConvex: ['clerkId', 'orgId', 'pushToken'] as const,
} as const;
