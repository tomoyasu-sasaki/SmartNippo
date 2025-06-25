/**
 * @fileoverview 組織バリデーション機能
 *
 * @description 組織（Organization）関連のデータバリデーションを行う機能を提供します。
 * 組織名の重複チェック、プランタイプの検証、必須フィールドの確認などを実行します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { type ValidationError, type ValidationResult, validateName } from './common';

/**
 * 組織データの包括的バリデーション
 *
 * @description 新規組織作成や既存組織の更新時に使用するバリデーション mutation です。
 * 組織名の重複確認、プランタイプの妥当性、命名規則への準拠などを検証します。
 *
 * @mutation
 * @param {Object} args - バリデーション対象のデータ
 * @param {string} args.name - 組織名
 * @param {'free'|'pro'|'enterprise'} args.plan - 組織のプランタイプ
 * @returns {Promise<ValidationResult>} バリデーション結果
 * @throws {Error} データベースアクセスエラーが発生した場合
 * @example
 * ```typescript
 * const result = await validateOrganization({
 *   name: 'My Company',
 *   plan: 'pro'
 * });
 *
 * if (result.isValid) {
 *   console.log('Organization data is valid');
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateOrganization = mutation({
  args: {
    name: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];

    // Name validation
    errors.push(...validateName(args.name, 'name'));

    // Plan validation
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(args.plan)) {
      errors.push({
        field: 'plan',
        message: 'Invalid plan type',
        code: 'INVALID_VALUE',
        value: args.plan,
      });
    }

    // Check for duplicate organization names
    if (args.name) {
      const existingOrg = await ctx.db
        .query('orgs')
        .filter((q) => q.eq(q.field('name'), args.name))
        .first();

      if (existingOrg) {
        errors.push({
          field: 'name',
          message: 'Organization name already exists',
          code: 'DUPLICATE',
          value: args.name,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});
