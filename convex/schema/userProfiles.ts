/**
 * @fileoverview ユーザープロファイルテーブルのスキーマ定義
 *
 * @property {string | undefined} email - メールアドレス (後方互換性のためのオプショナル)
 * @property {string | undefined} tokenIdentifier - Clerkのトークン識別子
 * @property {string} name - ユーザー名
 * @property {'viewer' | 'user' | 'manager' | 'admin'} role - ユーザーロール
 * @property {Id<'orgs'> | undefined} orgId - 所属組織ID
 * @property {string | undefined} avatarUrl - アバター画像のURL (レガシーサポート)
 * @property {Id<'_storage'> | undefined} avatarStorageId - ConvexファイルストレージID
 * @property {string | undefined} pushToken - Expoプッシュ通知トークン
 * @property {object | undefined} socialLinks - ソーシャルメディアリンク
 * @property {object | undefined} privacySettings - プライバシー設定
 * @property {number} created_at - 作成日時 (Unixタイムスタンプ)
 * @property {number} updated_at - 更新日時 (Unixタイムスタンプ)
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * ユーザープロファイルテーブル (userProfiles)
 * @description ユーザーアカウント情報、ロール、所属組織、設定などを管理します。
 */
export const userProfilesTable = defineTable({
  clerkId: v.string(), // Clerk User ID
  email: v.optional(v.string()), // Optional for backward compatibility
  tokenIdentifier: v.optional(v.string()), // Clerk token identifier
  name: v.string(),
  role: v.union(
    v.literal('viewer'), // 読取専用
    v.literal('user'), // 自分の日報CRUD
    v.literal('manager'), // チーム日報閲覧/承認
    v.literal('admin') // 全操作 + org設定
  ),
  orgId: v.optional(v.id('orgs')), // Optional for initial user creation
  avatarUrl: v.optional(v.string()), // External URL (legacy support)
  avatarStorageId: v.optional(v.id('_storage')), // Convex File Storage ID
  pushToken: v.optional(v.string()), // Expo push notification token
  // Social links
  socialLinks: v.optional(
    v.object({
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      github: v.optional(v.string()),
      instagram: v.optional(v.string()),
      facebook: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
    })
  ),
  // Privacy settings
  privacySettings: v.optional(
    v.object({
      profile: v.optional(
        v.union(
          v.literal('public'),
          v.literal('organization'),
          v.literal('team'),
          v.literal('private')
        )
      ),
      email: v.optional(
        v.union(
          v.literal('public'),
          v.literal('organization'),
          v.literal('team'),
          v.literal('private')
        )
      ),
      socialLinks: v.optional(
        v.union(
          v.literal('public'),
          v.literal('organization'),
          v.literal('team'),
          v.literal('private')
        )
      ),
      reports: v.optional(
        v.union(
          v.literal('public'),
          v.literal('organization'),
          v.literal('team'),
          v.literal('private')
        )
      ),
      avatar: v.optional(
        v.union(
          v.literal('public'),
          v.literal('organization'),
          v.literal('team'),
          v.literal('private')
        )
      ),
    })
  ),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index('by_clerk_id', ['clerkId'])
  .index('by_email', ['email'])
  .index('by_token', ['tokenIdentifier'])
  .index('by_org', ['orgId'])
  .index('by_org_role', ['orgId', 'role'])
  .index('by_created_at', ['created_at']);
