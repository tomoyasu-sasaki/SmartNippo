/**
 * @fileoverview スキーマバージョニングシステム
 *
 * @description データベーススキーマのバージョン管理、健全性チェック、
 * マイグレーション進行状況の追跡を行うシステムを提供します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

/**
 * スキーマバージョン定義
 *
 * @description アプリケーションでサポートされているスキーマバージョンの定義です。
 * 新しいスキーマバージョンを追加する際は、この定数オブジェクトを更新してください。
 *
 * @constant
 * @readonly
 * @since 1.0.0
 */
export const SCHEMA_VERSIONS = {
  /** 初期スキーマバージョン */
  V1_INITIAL: 1,
  /** レポート機能強化バージョン */
  V2_ENHANCED_REPORTS: 2,
  /** パフォーマンス向上インデックス追加バージョン */
  V3_PERFORMANCE_INDEXES: 3,
} as const;

/**
 * 現在の目標スキーマバージョン
 *
 * @description アプリケーションが対応している最新のスキーマバージョンです。
 * マイグレーション実行時の目標バージョンとして使用されます。
 *
 * @constant
 * @since 1.0.0
 */
export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSIONS.V3_PERFORMANCE_INDEXES;

// 現在のスキーマバージョンを取得
export const getCurrentVersion = query({
  args: {},
  handler: async (ctx) => {
    const latestVersion = await ctx.db.query('schema_versions').order('desc').first();
    return {
      currentVersion: latestVersion?.version ?? 0,
      targetVersion: CURRENT_SCHEMA_VERSION,
      needsUpdate: (latestVersion?.version ?? 0) < CURRENT_SCHEMA_VERSION,
    };
  },
});

// スキーマバージョンを記録
export const setSchemaVersion = mutation({
  args: {
    version: v.number(),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('schema_versions', {
      ...args,
      appliedAt: Date.now(),
    });
  },
});

// バージョン履歴取得
export const getVersionHistory = query({
  args: {},
  handler: async (ctx) => {
    const history = await ctx.db.query('schema_versions').order('desc').collect();

    return {
      history,
      currentVersion: history[0]?.version ?? 0,
    };
  },
});

// スキーマ健全性チェック
export const validateSchema = query({
  args: {},
  handler: async (ctx) => {
    const issues: string[] = [];
    const currentVersion = await ctx.db.query('schema_versions').order('desc').first();

    const current = currentVersion?.version ?? 0;

    // バージョン整合性チェック
    if (current > CURRENT_SCHEMA_VERSION) {
      issues.push(
        `Current schema version (${current}) is higher than supported version (${CURRENT_SCHEMA_VERSION})`
      );
    }

    // データ整合性の基本チェック
    try {
      const [orgsCount, usersCount, reportsCount] = await Promise.all([
        ctx.db
          .query('orgs')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('userProfiles')
          .collect()
          .then((r) => r.length),
        ctx.db
          .query('reports')
          .collect()
          .then((r) => r.length),
      ]);

      if (usersCount > 0 && orgsCount === 0) {
        issues.push('Users exist but no organizations found');
      }

      if (reportsCount > 0 && usersCount === 0) {
        issues.push('Reports exist but no users found');
      }
    } catch (error) {
      issues.push(`Failed to validate data integrity: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      currentVersion: current,
      issues,
      timestamp: Date.now(),
    };
  },
});

// マイグレーション進行状況記録
export const recordMigrationProgress = mutation({
  args: {
    migrationName: v.string(),
    status: v.union(v.literal('started'), v.literal('completed'), v.literal('failed')),
    details: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 現在の組織を取得（システム操作用）。存在しない場合はnull。
    const firstOrg = await ctx.db.query('orgs').first();

    // 現在のユーザーを取得（システム操作用）。存在しない場合はnull。
    const firstUser = await ctx.db.query('userProfiles').first();

    // audit_logs テーブルに記録
    const auditEntry: any = {
      action: `migration_${args.status}`,
      payload: {
        migrationName: args.migrationName,
        details: args.details,
        error: args.error,
        timestamp: Date.now(),
      },
      created_at: Date.now(),
    };

    if (firstUser) {
      auditEntry.actor_id = firstUser._id;
    }

    if (firstOrg) {
      auditEntry.org_id = firstOrg._id;
    }

    await ctx.db.insert('audit_logs', auditEntry);

    return { success: true };
  },
});
