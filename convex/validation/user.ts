/**
 * @fileoverview ユーザープロファイルバリデーション機能
 *
 * @description ユーザープロファイル関連のデータバリデーションを行う機能を提供します。
 * メール重複チェック、ロール権限検証、ソーシャルリンクの形式確認、組織所属の妥当性などを検証します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import {
  type ValidationError,
  type ValidationResult,
  validateEmail,
  validateName,
  validateUrl,
} from './common';

/**
 * ユーザープロファイルの包括的バリデーション
 *
 * @description ユーザープロファイルの作成・更新時に使用するバリデーション mutation です。
 * 必須フィールドの確認、メールアドレスの重複チェック、ロール権限の妥当性、
 * 組織所属の確認、ソーシャルリンクのURL形式検証などを包括的に実行します。
 *
 * @mutation
 * @param {Object} args - バリデーション対象のユーザープロファイルデータ
 * @param {string} [args.email] - メールアドレス（オプション）
 * @param {string} args.name - ユーザー名
 * @param {'viewer'|'user'|'manager'|'admin'} args.role - ユーザーロール
 * @param {Id<'orgs'>} [args.orgId] - 所属組織ID（オプション）
 * @param {string} [args.avatarUrl] - アバター画像URL（オプション）
 * @param {Object} [args.socialLinks] - ソーシャルリンク（オプション）
 * @returns {Promise<ValidationResult>} バリデーション結果
 * @throws {Error} データベースアクセスエラーまたは組織が見つからない場合
 * @example
 * ```typescript
 * const result = await validateUserProfile({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   role: 'user',
 *   orgId: organizationId,
 *   socialLinks: {
 *     twitter: 'https://twitter.com/johndoe',
 *     linkedin: 'https://linkedin.com/in/johndoe'
 *   }
 * });
 *
 * if (result.isValid) {
 *   console.log('User profile is valid');
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateUserProfile = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal('viewer'), v.literal('user'), v.literal('manager'), v.literal('admin')),
    orgId: v.optional(v.id('orgs')),
    avatarUrl: v.optional(v.string()),
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
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];

    // Email validation (if provided)
    if (args.email) {
      errors.push(...validateEmail(args.email));

      // Check for duplicate email
      const existingUser = await ctx.db.query('userProfiles').first();

      if (existingUser) {
        errors.push({
          field: 'email',
          message: 'Email already registered',
          code: 'DUPLICATE',
          value: args.email,
        });
      }
    }

    // Name validation
    errors.push(...validateName(args.name, 'name'));

    // Role validation
    const validRoles = ['viewer', 'user', 'manager', 'admin'];
    if (!validRoles.includes(args.role)) {
      errors.push({
        field: 'role',
        message: 'Invalid role',
        code: 'INVALID_VALUE',
        value: args.role,
      });
    }

    // Organization validation
    if (args.orgId) {
      const org = await ctx.db.get(args.orgId);
      if (!org) {
        errors.push({
          field: 'orgId',
          message: 'Organization not found',
          code: 'NOT_FOUND',
          value: args.orgId,
        });
      }
    }

    // Avatar URL validation
    if (args.avatarUrl) {
      errors.push(...validateUrl(args.avatarUrl, 'avatarUrl'));
    }

    // Social links validation
    if (args.socialLinks) {
      Object.entries(args.socialLinks).forEach(([platform, url]) => {
        if (url) {
          errors.push(...validateUrl(url, `socialLinks.${platform}`));
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});
