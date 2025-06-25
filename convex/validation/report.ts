/**
 * @fileoverview 日報データバリデーション機能
 *
 * @description 日報の作成・更新時に使用される包括的なデータバリデーション機能、
 * およびバリデーション関連の統計情報取得、エラーログ記録機能を提供します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import type { ValidationError, ValidationResult } from './common';

/**
 * 日報データの包括的バリデーション
 *
 * @description 日報の作成・更新時に使用されるバリデーション mutation です。
 * 著者・組織の存在確認、日付の妥当性、タイトル・内容の文字数制限、
 * タスク・添付ファイルの整合性、重複日報のチェックなど、包括的な検証を行います。
 *
 * @mutation
 * @param {Object} args - 検証対象の日報データ
 * @returns {Promise<ValidationResult>} バリデーション結果
 * @throws {Error} データベースアクセスエラーが発生した場合
 * @example
 * ```typescript
 * const result = await validateReport({ ...reportData });
 * if (result.isValid) {
 *   // 日報を保存
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateReport = mutation({
  args: {
    authorId: v.id('userProfiles'),
    reportDate: v.string(),
    title: v.string(),
    content: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('submitted'),
      v.literal('approved'),
      v.literal('rejected')
    ),
    orgId: v.id('orgs'),
    tasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
          priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
          estimatedHours: v.optional(v.number()),
          actualHours: v.optional(v.number()),
          category: v.optional(v.string()),
        })
      )
    ),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
          size: v.number(),
          type: v.string(),
          uploadedAt: v.number(),
          description: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];

    // Author validation
    const author = await ctx.db.get(args.authorId);
    if (!author) {
      errors.push({
        field: 'authorId',
        message: 'Author not found',
        code: 'NOT_FOUND',
        value: args.authorId,
      });
    } else if (author.orgId !== args.orgId) {
      errors.push({
        field: 'authorId',
        message: 'Author does not belong to the specified organization',
        code: 'UNAUTHORIZED',
        value: args.authorId,
      });
    }

    // Organization validation
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      errors.push({
        field: 'orgId',
        message: 'Organization not found',
        code: 'NOT_FOUND',
        value: args.orgId,
      });
    }

    // Report date validation
    if (!args.reportDate) {
      errors.push({ field: 'reportDate', message: 'Report date is required', code: 'REQUIRED' });
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(args.reportDate)) {
        errors.push({
          field: 'reportDate',
          message: 'Invalid date format (expected YYYY-MM-DD)',
          code: 'INVALID_FORMAT',
          value: args.reportDate,
        });
      } else {
        const date = new Date(args.reportDate);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (date < oneYearAgo) {
          errors.push({
            field: 'reportDate',
            message: 'Report date cannot be more than 1 year ago',
            code: 'OUT_OF_RANGE',
            value: args.reportDate,
          });
        } else if (date > oneWeekFromNow) {
          errors.push({
            field: 'reportDate',
            message: 'Report date cannot be more than 1 week in the future',
            code: 'OUT_OF_RANGE',
            value: args.reportDate,
          });
        }
      }
    }

    // Title validation
    if (!args.title || args.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required', code: 'REQUIRED' });
    } else if (args.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title too long (max 200 characters)',
        code: 'TOO_LONG',
        value: args.title,
      });
    }

    // Content validation
    if (!args.content || args.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Content is required', code: 'REQUIRED' });
    } else if (args.content.length > 10000) {
      errors.push({
        field: 'content',
        message: 'Content too long (max 10000 characters)',
        code: 'TOO_LONG',
        value: args.content.length,
      });
    }

    // Status validation
    const validStatuses = ['draft', 'submitted', 'approved', 'rejected'];
    if (!validStatuses.includes(args.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid status',
        code: 'INVALID_VALUE',
        value: args.status,
      });
    }

    // Tasks validation
    if (args.tasks) {
      if (args.tasks.length > 50) {
        errors.push({
          field: 'tasks',
          message: 'Too many tasks (max 50)',
          code: 'TOO_MANY',
          value: args.tasks.length,
        });
      }

      args.tasks.forEach((task, index) => {
        if (!task.title || task.title.trim().length === 0) {
          errors.push({
            field: `tasks[${index}].title`,
            message: 'Task title is required',
            code: 'REQUIRED',
          });
        } else if (task.title.length > 100) {
          errors.push({
            field: `tasks[${index}].title`,
            message: 'Task title too long (max 100 characters)',
            code: 'TOO_LONG',
            value: task.title,
          });
        }

        if (task.estimatedHours && (task.estimatedHours < 0 || task.estimatedHours > 24)) {
          errors.push({
            field: `tasks[${index}].estimatedHours`,
            message: 'Estimated hours must be between 0 and 24',
            code: 'OUT_OF_RANGE',
            value: task.estimatedHours,
          });
        }

        if (task.actualHours && (task.actualHours < 0 || task.actualHours > 24)) {
          errors.push({
            field: `tasks[${index}].actualHours`,
            message: 'Actual hours must be between 0 and 24',
            code: 'OUT_OF_RANGE',
            value: task.actualHours,
          });
        }
      });
    }

    // Attachments validation
    if (args.attachments) {
      if (args.attachments.length > 20) {
        errors.push({
          field: 'attachments',
          message: 'Too many attachments (max 20)',
          code: 'TOO_MANY',
          value: args.attachments.length,
        });
      }

      args.attachments.forEach((attachment, index) => {
        if (!attachment.name || attachment.name.trim().length === 0) {
          errors.push({
            field: `attachments[${index}].name`,
            message: 'Attachment name is required',
            code: 'REQUIRED',
          });
        }

        if (attachment.size > 50 * 1024 * 1024) {
          // 50MB
          errors.push({
            field: `attachments[${index}].size`,
            message: 'File too large (max 50MB)',
            code: 'TOO_LARGE',
            value: attachment.size,
          });
        }

        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/json',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!allowedTypes.includes(attachment.type)) {
          errors.push({
            field: `attachments[${index}].type`,
            message: 'File type not allowed',
            code: 'INVALID_TYPE',
            value: attachment.type,
          });
        }
      });
    }

    // Check for duplicate report on same date by same author
    if (author && args.reportDate) {
      const existingReport = await ctx.db
        .query('reports')
        .withIndex('by_author_date', (q) =>
          q.eq('authorId', args.authorId).eq('reportDate', args.reportDate)
        )
        .first();

      if (existingReport) {
        errors.push({
          field: 'reportDate',
          message: 'Report already exists for this date',
          code: 'DUPLICATE',
          value: args.reportDate,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

/**
 * バリデーションエラー統計の取得
 *
 * @description 直近100件のバリデーションエラーを監査ログから集計し、
 * エラーコード別、フィールド別の統計情報を提供します。
 * システムの入力品質やユーザーの混乱箇所を特定するのに役立ちます。
 *
 * @query
 * @returns {Promise<Object>} バリデーションエラー統計
 * @returns {number} returns.totalErrors - 直近のエラー総数
 * @returns {Record<string, number>} returns.errorsByType - エラーコード別集計
 * @returns {Record<string, number>} returns.errorsByField - フィールド別集計
 * @returns {number} returns.timestamp - 統計取得時刻
 * @example
 * ```typescript
 * const stats = await getValidationStats();
 * console.log('Top error type:', Object.keys(stats.errorsByType)[0]);
 * console.log('Most problematic field:', Object.keys(stats.errorsByField)[0]);
 * ```
 * @since 1.0.0
 */
export const getValidationStats = query({
  args: {},
  handler: async (ctx) => {
    // 最近のvalidationエラーを audit_logs から取得
    const recentErrors = await ctx.db
      .query('audit_logs')
      .filter((q) => q.eq(q.field('action'), 'validation_error'))
      .order('desc')
      .take(100);

    const errorsByType = recentErrors.reduce(
      (acc, log) => {
        const errorCode = log.payload?.errorCode ?? 'UNKNOWN';
        acc[errorCode] = (acc[errorCode] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsByField = recentErrors.reduce(
      (acc, log) => {
        const field = log.payload?.field ?? 'UNKNOWN';
        acc[field] = (acc[field] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByField,
      timestamp: Date.now(),
    };
  },
});

/**
 * バリデーションエラーのログ記録
 *
 * @description 発生したバリデーションエラーを監査ログに記録します。
 * エラーの追跡、デバッグ、品質改善のためのデータソースとして利用されます。
 *
 * @mutation
 * @param {Object} args - エラーログ情報
 * @param {string} args.tableName - エラーが発生したテーブル名
 * @param {ValidationError[]} args.errors - エラー詳細の配列
 * @param {Id<'userProfiles'>} [args.userId] - 操作ユーザーID
 * @param {Id<'orgs'>} [args.orgId] - 組織ID
 * @returns {Promise<{success: boolean, errorsLogged: number}>} 記録結果
 * @example
 * ```typescript
 * const validationResult = await validateReport({ ... });
 * if (!validationResult.isValid) {
 *   await logValidationError({
 *     tableName: 'reports',
 *     errors: validationResult.errors,
 *     userId: currentUser._id,
 *     orgId: currentUser.orgId
 *   });
 * }
 * ```
 * @since 1.0.0
 */
export const logValidationError = mutation({
  args: {
    tableName: v.string(),
    errors: v.array(
      v.object({
        field: v.string(),
        message: v.string(),
        code: v.string(),
        value: v.optional(v.any()),
      })
    ),
    userId: v.optional(v.id('userProfiles')),
    orgId: v.optional(v.id('orgs')),
  },
  handler: async (ctx, args) => {
    // 各エラーを個別にログ記録
    for (const error of args.errors) {
      await ctx.db.insert('audit_logs', {
        actor_id: args.userId ?? ('system' as any),
        action: 'validation_error',
        payload: {
          tableName: args.tableName,
          field: error.field,
          message: error.message,
          errorCode: error.code,
          value: error.value,
          timestamp: Date.now(),
        },
        created_at: Date.now(),
        org_id: args.orgId ?? ('system' as any),
      });
    }

    return { success: true, errorsLogged: args.errors.length };
  },
});
