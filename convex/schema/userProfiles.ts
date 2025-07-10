/**
 * @fileoverview ユーザープロファイルテーブルのスキーマ定義
 *
 * @description Clerkへの移行に伴いスリム化。
 * アプリケーション固有の情報（ロール、組織連携など）のみを管理します。
 * SSoT (Single Source of Truth) はClerkです。
 *
 * @property {string} clerkId - ClerkのユーザーID (主キー)
 * @property {'user' | 'manager' | 'admin'} role - ユーザーロール (Clerk publicMetadataと同期)
 * @property {Id<'orgs'> | undefined} orgId - 所属組織ID
 * @property {Id<'_storage'> | undefined} avatarStorageId - ConvexファイルストレージID (Clerk imageUrlと同期)
 * @property {string | undefined} pushToken - Expoプッシュ通知トークン
 * @property {number} created_at - 作成日時 (Unixタイムスタンプ)
 * @property {number} updated_at - 更新日時 (Unixタイムスタンプ)
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * ユーザープロファイルテーブル (userProfiles)
 * @description ユーザーアカウント情報、ロール、所属組織、設定などを管理します。
 *
 * マイグレーション完了後のスリム化されたスキーマ。
 * name, email, avatarUrl, socialLinks, privacySettings等の
 * ユーザー情報はClerkのメタデータで管理されます。
 */
export const userProfilesTable = defineTable({
  clerkId: v.string(), // Clerk User ID
  role: v.union(
    v.literal('user'), // 自分の日報CRUD
    v.literal('manager'), // チーム日報閲覧/承認
    v.literal('admin') // 全操作 + org設定
  ),
  orgId: v.optional(v.id('orgs')), // Optional for initial user creation
  avatarStorageId: v.optional(v.id('_storage')), // Convex File Storage ID
  pushToken: v.optional(v.string()), // Expo push notification token
  created_at: v.number(),
  updated_at: v.number(),
})
  .index('by_clerk_id', ['clerkId'])
  .index('by_org', ['orgId'])
  .index('by_org_role', ['orgId', 'role'])
  .index('by_created_at', ['created_at']);
