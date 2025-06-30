import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import {
  logAuditEvent,
  requireAuthentication,
  requireOwnershipOrManagerRole,
  requireRole,
  requireWriteAccess,
} from '../auth/auth';

/**
 * @fileoverview 日報データの作成・更新・削除Mutation
 *
 * @description 日報のライフサイクル（作成、更新、削除、復元、承認、却下）を
 * 管理するMutation関数群を提供します。権限チェック、楽観的ロック、
 * 監査ログ記録などの重要な機能を含みます。
 *
 * @since 1.0.0
 */

// ============================
// Validators
// ============================
const taskInput = v.object({
  _id: v.optional(v.id('tasks')),
  projectId: v.id('projects'),
  workCategoryId: v.id('workCategories'),
  description: v.string(),
  workDuration: v.number(),
  _isDeleted: v.optional(v.boolean()),
});

// ============================
// Mutations
// ============================

/**
 * 新規日報の作成
 *
 * @description 新しい日報を作成します。ユーザーは自身の組織にのみ作成可能です。
 * 同じ日付の日報が既に存在する場合はエラーとなります。
 *
 * @mutation
 * @param {Object} args - 日報データ
 * @returns {Promise<Id<'reports'>>} 作成された日報のID
 * @throws {Error} 認証失敗、権限不足、重複日報、またはバリデーション違反の場合
 * @example
 * ```typescript
 * const reportId = await createReport({
 *   reportDate: '2024-01-01',
 *   title: 'My First Report',
 *   content: '...'
 * });
 * ```
 * @since 1.0.0
 */
export const createReport = mutation({
  args: {
    reportDate: v.string(), // YYYY-MM-DD形式
    title: v.string(),
    content: v.string(),
    workingHours: v.optional(
      v.object({
        startHour: v.number(),
        startMinute: v.number(),
        endHour: v.number(),
        endMinute: v.number(),
      })
    ),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          size: v.number(),
          type: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
          uploadedAt: v.number(),
          description: v.optional(v.string()),
        })
      )
    ),
    metadata: v.optional(
      v.object({
        version: v.optional(v.number()),
        template: v.optional(v.string()),
        difficulty: v.optional(v.union(v.literal('easy'), v.literal('medium'), v.literal('hard'))),
        achievements: v.optional(v.array(v.string())),
        challenges: v.optional(v.array(v.string())),
        learnings: v.optional(v.array(v.string())),
        nextActionItems: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    // 認証チェック
    const user = await requireAuthentication(ctx);

    // 組織の書き込み権限チェック
    await requireWriteAccess(ctx, user.orgId!);

    // 同じ日付の日報が既に存在しないかチェック
    const existingReport = await ctx.db
      .query('reports')
      .withIndex('by_author_date', (q) =>
        q.eq('authorId', user._id).eq('reportDate', args.reportDate)
      )
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .first();

    if (existingReport) {
      throw new Error(`${args.reportDate} の日報は既に存在します`);
    }

    // バリデーション
    if (!args.title || args.title.trim().length === 0) {
      throw new Error('タイトルは必須です');
    }
    if (!args.content || args.content.trim().length === 0) {
      throw new Error('内容は必須です');
    }
    if (args.title.length > 200) {
      throw new Error('タイトルは200文字以内で入力してください');
    }
    if (args.content.length > 10000) {
      throw new Error('内容は10000文字以内で入力してください');
    }

    const now = Date.now();
    // 日報作成
    const reportInsert: any = {
      authorId: user._id,
      reportDate: args.reportDate,
      title: args.title.trim(),
      content: args.content.trim(),
      status: 'draft',
      attachments: args.attachments ?? [],
      metadata: {
        ...args.metadata,
        version: args.metadata?.version ?? 1,
      },
      isDeleted: false,
      orgId: user.orgId!,
      created_at: now,
      updated_at: now,
      aiSummaryStatus: 'pending',
      editHistory: [],
    };
    if (args.workingHours) {
      reportInsert.workingHours = args.workingHours;
    }

    const reportId = await ctx.db.insert('reports', reportInsert);

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'report_created',
      {
        reportId,
        reportDate: args.reportDate,
        title: args.title,
      },
      user.orgId!
    );

    return reportId;
  },
});

/**
 * 日報の更新
 *
 * @description 既存の日報を更新します。楽観的ロックをサポートしており、
 * 同時編集によるコンフリクトを防止します。ステータス変更には追加の権限が必要です。
 *
 * @mutation
 * @param {Object} args - 更新データ
 * @param {Id<'reports'>} args.reportId - 更新対象の日報ID
 * @param {number} args.expectedUpdatedAt - 楽観的ロック用のタイムスタンプ
 * @returns {Promise<{success: boolean, updated_at: number}>} 更新結果
 * @throws {Error} 日報が見つからない、権限不足、楽観的ロック競合、またはバリデーション違反の場合
 * @example
 * ```typescript
 * await updateReport({
 *   reportId: 'report123',
 *   expectedUpdatedAt: 1672531200000,
 *   title: 'Updated Title'
 * });
 * ```
 * @since 1.0.0
 */
export const updateReport = mutation({
  args: {
    reportId: v.id('reports'),
    expectedUpdatedAt: v.number(), // 楽観的ロックのための現在のupdated_at値
    reportDate: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    workingHours: v.optional(
      v.object({
        startHour: v.number(),
        startMinute: v.number(),
        endHour: v.number(),
        endMinute: v.number(),
      })
    ),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('submitted'),
        v.literal('approved'),
        v.literal('rejected')
      )
    ),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          size: v.number(),
          type: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
          uploadedAt: v.number(),
          description: v.optional(v.string()),
        })
      )
    ),
    metadata: v.optional(
      v.object({
        version: v.optional(v.number()),
        template: v.optional(v.string()),
        difficulty: v.optional(v.union(v.literal('easy'), v.literal('medium'), v.literal('hard'))),
        achievements: v.optional(v.array(v.string())),
        challenges: v.optional(v.array(v.string())),
        learnings: v.optional(v.array(v.string())),
        nextActionItems: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { reportId, expectedUpdatedAt, ...updates } = args;

    // レポート取得
    const report = await ctx.db.get(reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // 権限チェック - 作成者本人またはadmin
    const user = await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    // 楽観的ロックチェック
    if (report.updated_at !== expectedUpdatedAt) {
      throw new Error(
        '日報が他のユーザーによって更新されています。最新の内容を読み込み直してください。'
      );
    }

    // ステータス変更の権限チェック
    if (updates.status && updates.status !== report.status) {
      // 承認済み/却下済みの日報は作成者が変更できない
      if (
        (report.status === 'approved' || report.status === 'rejected') &&
        user._id === report.authorId
      ) {
        throw new Error('承認済み/却下済みの日報は編集できません');
      }

      // approved/rejectedへの変更はmanager以上のみ
      if (
        (updates.status === 'approved' || updates.status === 'rejected') &&
        !user.role.includes('manager') &&
        !user.role.includes('admin')
      ) {
        throw new Error('承認/却下はマネージャー以上の権限が必要です');
      }
    }

    // バリデーション
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim().length === 0) {
        throw new Error('タイトルは必須です');
      }
      if (updates.title.length > 200) {
        throw new Error('タイトルは200文字以内で入力してください');
      }
    }
    if (updates.content !== undefined) {
      if (!updates.content || updates.content.trim().length === 0) {
        throw new Error('内容は必須です');
      }
      if (updates.content.length > 10000) {
        throw new Error('内容は10000文字以内で入力してください');
      }
    }

    // 編集履歴の記録
    const editHistory = report.editHistory ?? [];
    const changedFields: string[] = [];

    if (updates.title !== undefined && updates.title !== report.title) {
      changedFields.push('title');
    }
    if (updates.content !== undefined && updates.content !== report.content) {
      changedFields.push('content');
    }
    if (updates.workingHours !== undefined) {
      changedFields.push('workingHours');
    }
    if (updates.status !== undefined && updates.status !== report.status) {
      changedFields.push('status');
    }
    if (updates.attachments !== undefined) {
      changedFields.push('attachments');
    }
    if (updates.metadata !== undefined) {
      changedFields.push('metadata');
    }

    if (changedFields.length > 0) {
      editHistory.push({
        editedAt: Date.now(),
        editorId: user._id,
        changes: `Updated: ${changedFields.join(', ')}`,
      });
    }

    const now = Date.now();
    // 更新実行
    const updatedFields: any = {
      updated_at: now,
      editHistory,
    };

    if (updates.reportDate !== undefined) {
      updatedFields.reportDate = updates.reportDate;
    }
    if (updates.title !== undefined) {
      updatedFields.title = updates.title.trim();
    }
    if (updates.content !== undefined) {
      updatedFields.content = updates.content.trim();
    }
    if (updates.workingHours !== undefined) {
      updatedFields.workingHours = updates.workingHours;
    }
    if (updates.status !== undefined) {
      updatedFields.status = updates.status;
      if (updates.status === 'submitted') {
        updatedFields.submittedAt = Date.now();
      } else if (updates.status === 'approved') {
        updatedFields.approvedAt = Date.now();
      } else if (updates.status === 'rejected') {
        updatedFields.rejectedAt = Date.now();
      }
    }
    if (updates.attachments !== undefined) {
      updatedFields.attachments = updates.attachments;
    }
    if (updates.metadata !== undefined) {
      updatedFields.metadata = {
        ...report.metadata,
        ...updates.metadata,
      };
    }

    await ctx.db.patch(reportId, updatedFields);

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'report_updated',
      {
        reportId,
        changedFields,
        oldStatus: report.status,
        newStatus: updates.status,
      },
      report.orgId
    );

    return { success: true, updated_at: updatedFields.updated_at };
  },
});

/**
 * 日報の論理削除
 *
 * @description 日報を論理的に削除します。データは物理的には削除されず、
 * `isDeleted` フラグが設定されます。承認済みの日報は管理者のみが削除可能です。
 *
 * @mutation
 * @param {Object} args - 削除情報
 * @param {Id<'reports'>} args.reportId - 削除対象の日報ID
 * @param {string} [args.reason] - 削除理由（管理者用）
 * @returns {Promise<{success: boolean}>} 削除結果
 * @throws {Error} 日報が見つからない、または権限不足の場合
 * @example
 * ```typescript
 * await deleteReport({ reportId: 'report123' });
 * ```
 * @since 1.0.0
 */
export const deleteReport = mutation({
  args: {
    reportId: v.id('reports'),
    reason: v.optional(v.string()), // 削除理由（管理者用）
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error('日報が見つかりません');
    }
    if (report.isDeleted) {
      throw new Error('この日報は既に削除されています');
    }

    // 権限チェック - 作成者本人またはadmin
    const user = await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    // 承認済みの日報は作成者が削除できない（adminのみ可）
    if (report.status === 'approved' && user._id === report.authorId && user.role !== 'admin') {
      throw new Error('承認済みの日報は削除できません。管理者にお問い合わせください。');
    }

    // 論理削除実行
    await ctx.db.patch(args.reportId, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: user._id,
      updated_at: Date.now(),
    });

    // 関連する承認データを無効化（物理削除はしない）
    const approvals = await ctx.db
      .query('approvals')
      .withIndex('by_report', (q) => q.eq('reportId', args.reportId))
      .collect();

    // 承認データが存在する場合は警告ログを出力
    if (approvals.length > 0) {
      console.warn(`Deleting report with ${approvals.length} approvals: ${args.reportId}`);
    }

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'report_deleted',
      {
        reportId: args.reportId,
        reportDate: report.reportDate,
        title: report.title,
        reason: args.reason,
        hadApprovals: approvals.length > 0,
      },
      report.orgId
    );

    return { success: true };
  },
});

/**
 * 日報の復元
 *
 * @description 論理削除された日報を復元します。この操作は管理者のみ実行可能です。
 *
 * @mutation
 * @param {Object} args - 復元情報
 * @param {Id<'reports'>} args.reportId - 復元対象の日報ID
 * @returns {Promise<{success: boolean}>} 復元結果
 * @throws {Error} 日報が見つからない、または権限不足の場合
 * @example
 * ```typescript
 * await restoreReport({ reportId: 'report456' });
 * ```
 * @since 1.0.0
 */
export const restoreReport = mutation({
  args: {
    reportId: v.id('reports'),
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error('日報が見つかりません');
    }
    if (!report.isDeleted) {
      throw new Error('この日報は削除されていません');
    }

    // 管理者権限チェック
    const user = await requireRole(ctx, 'admin', report.orgId);

    // 復元実行
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deletedAt, deletedBy, ...restOfReport } = report;
    await ctx.db.replace(args.reportId, {
      ...restOfReport,
      isDeleted: false,
      updated_at: Date.now(),
    });

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'report_restored',
      {
        reportId: args.reportId,
        reportDate: report.reportDate,
        title: report.title,
        originalDeletedAt: report.deletedAt,
        originalDeletedBy: report.deletedBy,
      },
      report.orgId
    );

    return { success: true };
  },
});

/**
 * 日報の承認
 *
 * @description 提出された日報を承認します。マネージャー以上の権限が必要です。
 * 承認済みの日報は再承認できません。
 *
 * @mutation
 * @param {Object} args - 承認情報
 * @param {Id<'reports'>} args.reportId - 承認対象の日報ID
 * @param {string} [args.comment] - 承認時コメント
 * @returns {Promise<{success: boolean}>} 承認結果
 * @throws {Error} 日報が見つからない、権限不足、またはステータスが不適切な場合
 * @example
 * ```typescript
 * await approveReport({
 *   reportId: 'report789',
 *   comment: 'Good work!'
 * });
 * ```
 * @since 1.0.0
 */
export const approveReport = mutation({
  args: {
    reportId: v.id('reports'),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // マネージャー権限チェック
    const user = await requireRole(ctx, 'manager', report.orgId);

    // ステータスチェック
    if (report.status === 'approved') {
      throw new Error('この日報は既に承認されています');
    }
    if (report.status !== 'submitted') {
      throw new Error('提出済みの日報のみ承認できます');
    }

    // 承認実行
    await ctx.db.patch(args.reportId, {
      status: 'approved',
      approvedAt: Date.now(),
      updated_at: Date.now(),
    });

    // 承認記録を作成
    await ctx.db.insert('approvals', {
      reportId: args.reportId,
      managerId: user._id,
      approved_at: Date.now(),
    });

    // 承認コメントがある場合は追加
    if (args.comment?.trim()) {
      await ctx.db.insert('comments', {
        reportId: args.reportId,
        authorId: user._id,
        content: args.comment.trim(),
        type: 'user',
        created_at: Date.now(),
      });
    }

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'report_approved',
      {
        reportId: args.reportId,
        reportDate: report.reportDate,
        title: report.title,
        authorId: report.authorId,
        comment: args.comment,
      },
      report.orgId
    );

    return { success: true };
  },
});

/**
 * 日報の却下
 *
 * @description 提出された日報を却下します。マネージャー以上の権限が必要で、
 * 却下理由は必須です。
 *
 * @mutation
 * @param {Object} args - 却下情報
 * @param {Id<'reports'>} args.reportId - 却下対象の日報ID
 * @param {string} args.reason - 却下理由
 * @returns {Promise<{success: boolean}>} 却下結果
 * @throws {Error} 日報が見つからない、権限不足、ステータスが不適切、または却下理由が未入力の場合
 * @example
 * ```typescript
 * await rejectReport({
 *   reportId: 'reportABC',
 *   reason: 'Please provide more details on task A.'
 * });
 * ```
 * @since 1.0.0
 */
export const rejectReport = mutation({
  args: {
    reportId: v.id('reports'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // マネージャー権限チェック
    const user = await requireRole(ctx, 'manager', report.orgId);

    // ステータスチェック
    if (report.status === 'rejected') {
      throw new Error('この日報は既に却下されています');
    }
    if (report.status !== 'submitted') {
      throw new Error('提出済みの日報のみ却下できます');
    }

    // 却下理由のバリデーション
    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error('却下理由は必須です');
    }
    if (args.reason.length > 500) {
      throw new Error('却下理由は500文字以内で入力してください');
    }

    // 却下実行
    await ctx.db.patch(args.reportId, {
      status: 'rejected',
      rejectedAt: Date.now(),
      rejectionReason: args.reason.trim(),
      updated_at: Date.now(),
    });

    // 却下理由をコメントとして追加
    await ctx.db.insert('comments', {
      reportId: args.reportId,
      authorId: user._id,
      content: `却下理由: ${args.reason.trim()}`,
      type: 'system',
      created_at: Date.now(),
    });

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'report_rejected',
      {
        reportId: args.reportId,
        reportDate: report.reportDate,
        title: report.title,
        authorId: report.authorId,
        reason: args.reason,
      },
      report.orgId
    );

    return { success: true };
  },
});
