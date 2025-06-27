/**
 * @fileoverview スキーマバージョン管理テーブルのスキーマ定義
 *
 * @property {number} version - スキーマバージョン番号
 * @property {string} name - バージョン名
 * @property {string} description - バージョンの説明
 * @property {number} appliedAt - 適用日時
 * @property {string | undefined} rollbackScript - ロールバックスクリプトの内容
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * スキーマバージョンテーブル (schema_versions)
 * @description データベースマイグレーションの履歴を管理します。
 */
export const schemaVersionsTable = defineTable({
  version: v.number(),
  name: v.string(),
  description: v.string(),
  appliedAt: v.number(),
  rollbackScript: v.optional(v.string()),
})
  .index('by_version', ['version'])
  .index('by_applied_at', ['appliedAt']);
