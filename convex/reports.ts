import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
  logAuditEvent,
  requireAuthentication,
  requireOwnershipOrManagerRole,
  requireRole,
  requireWriteAccess,
} from './lib/auth';

// ============================
// Mutations
// ============================

/**
 * 日報作成 mutation
 * 権限: user以上（自分の日報のみ作成可能）
 */
export const createReport = mutation({
  args: {
    reportDate: v.string(), // YYYY-MM-DD形式
    title: v.string(),
    content: v.string(),
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

    // 日報作成
    const reportId = await ctx.db.insert('reports', {
      authorId: user._id,
      reportDate: args.reportDate,
      title: args.title.trim(),
      content: args.content.trim(),
      status: 'draft',
      tasks: args.tasks ?? [],
      attachments: args.attachments ?? [],
      metadata: {
        ...args.metadata,
        version: args.metadata?.version ?? 1,
      },
      isDeleted: false,
      orgId: user.orgId!,
      created_at: Date.now(),
      updated_at: Date.now(),
      aiSummaryStatus: 'pending',
      editHistory: [],
    });

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
 * 日報更新 mutation
 * 権限: 作成者本人またはadmin
 * 楽観的ロック: updated_atを使用したコンフリクト検出
 */
export const updateReport = mutation({
  args: {
    reportId: v.id('reports'),
    expectedUpdatedAt: v.number(), // 楽観的ロックのための現在のupdated_at値
    reportDate: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('submitted'),
        v.literal('approved'),
        v.literal('rejected')
      )
    ),
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
    if (updates.status !== undefined && updates.status !== report.status) {
      changedFields.push('status');
    }
    if (updates.tasks !== undefined) {
      changedFields.push('tasks');
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

    // 更新実行
    const updatedFields: any = {
      updated_at: Date.now(),
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
    if (updates.tasks !== undefined) {
      updatedFields.tasks = updates.tasks;
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
 * 日報削除（論理削除）mutation
 * 権限: 作成者本人またはadmin
 * 関連データ: コメントは保持、承認データは無効化
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
 * 日報を編集用に取得するquery
 * 権限: 作成者本人またはmanager/admin
 * isDeletedがtrueの場合は取得不可
 */
export const getReportForEdit = query({
  args: {
    reportId: v.id('reports'),
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);

    if (!report || report.isDeleted) {
      console.error(`Attempt to fetch deleted or non-existent report for edit: ${args.reportId}`);
      return null;
    }

    // 権限チェック - 作成者本人またはmanager/admin
    await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);

    // ユーザープロファイル情報を取得
    const authorProfile = await ctx.db.get(report.authorId);

    return {
      ...report,
      author: authorProfile
        ? {
            _id: authorProfile._id,
            name: authorProfile.name,
            avatarUrl: authorProfile.avatarUrl,
          }
        : null,
    };
  },
});

/**
 * 日報復元 mutation
 * 権限: adminのみ
 * 削除された日報を復元する
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
 * 日報承認 mutation
 * 権限: manager以上
 * 承認済みの日報は再承認できない
 */
export const approveReport = mutation({
  args: {
    reportId: v.id('reports'),
    comment: v.optional(v.string()), // 承認コメント
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // manager権限チェック
    const user = await requireRole(ctx, 'manager', report.orgId);

    // ステータスチェック
    if (report.status === 'approved') {
      throw new Error('この日報は既に承認されています');
    }
    if (report.status === 'draft') {
      throw new Error('下書きの日報は承認できません');
    }

    // 自分の日報は承認できない（adminを除く）
    if (report.authorId === user._id && user.role !== 'admin') {
      throw new Error('自分の日報は承認できません');
    }

    // 承認実行
    const now = Date.now();
    await ctx.db.patch(args.reportId, {
      status: 'approved',
      approvedAt: now,
      updated_at: now,
    });

    // 承認記録を作成
    await ctx.db.insert('approvals', {
      reportId: args.reportId,
      managerId: user._id,
      approved_at: now,
    });

    // 承認コメントがある場合はコメントとして記録
    if (args.comment && args.comment.trim().length > 0) {
      await ctx.db.insert('comments', {
        reportId: args.reportId,
        authorId: user._id,
        content: args.comment.trim(),
        type: 'user',
        created_at: now,
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

    return { success: true, approvedAt: now };
  },
});

/**
 * 日報却下 mutation
 * 権限: manager以上
 * 却下理由は必須
 */
export const rejectReport = mutation({
  args: {
    reportId: v.id('reports'),
    reason: v.string(), // 却下理由（必須）
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // manager権限チェック
    const user = await requireRole(ctx, 'manager', report.orgId);

    // ステータスチェック
    if (report.status === 'rejected') {
      throw new Error('この日報は既に却下されています');
    }
    if (report.status === 'draft') {
      throw new Error('下書きの日報は却下できません');
    }
    if (report.status === 'approved') {
      throw new Error('承認済みの日報は却下できません');
    }

    // 自分の日報は却下できない（adminを除く）
    if (report.authorId === user._id && user.role !== 'admin') {
      throw new Error('自分の日報は却下できません');
    }

    // 却下理由のバリデーション
    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error('却下理由は必須です');
    }
    if (args.reason.length > 1000) {
      throw new Error('却下理由は1000文字以内で入力してください');
    }

    // 却下実行
    const now = Date.now();
    await ctx.db.patch(args.reportId, {
      status: 'rejected',
      rejectedAt: now,
      rejectionReason: args.reason.trim(),
      updated_at: now,
    });

    // 却下理由をシステムコメントとして記録
    await ctx.db.insert('comments', {
      reportId: args.reportId,
      authorId: user._id,
      content: `却下理由: ${args.reason.trim()}`,
      type: 'system',
      created_at: now,
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

    return { success: true, rejectedAt: now };
  },
});

// ============================
// Comment Mutations
// ============================

/**
 * コメント追加 mutation
 * 権限: viewer以上（組織メンバー）
 * 削除された日報にはコメントできない
 */
export const addComment = mutation({
  args: {
    reportId: v.id('reports'),
    content: v.string(),
    type: v.optional(v.union(v.literal('user'), v.literal('system'), v.literal('ai'))),
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // 読取権限チェック（viewer以上）
    const user = await requireRole(ctx, 'viewer', report.orgId);

    // コメントバリデーション
    if (!args.content || args.content.trim().length === 0) {
      throw new Error('コメント内容は必須です');
    }
    if (args.content.length > 2000) {
      throw new Error('コメントは2000文字以内で入力してください');
    }

    // コメントタイプの検証（systemとaiはシステムのみ作成可能）
    const commentType = args.type ?? 'user';
    if (commentType !== 'user' && user.role !== 'admin') {
      throw new Error('システムコメントは作成できません');
    }

    // コメント作成
    const commentId = await ctx.db.insert('comments', {
      reportId: args.reportId,
      authorId: user._id,
      content: args.content.trim(),
      type: commentType,
      created_at: Date.now(),
    });

    // 監査ログ記録（重要なコメントのみ）
    if (commentType === 'system' || report.status === 'approved') {
      await logAuditEvent(
        ctx,
        user._id,
        'comment_added',
        {
          commentId,
          reportId: args.reportId,
          reportDate: report.reportDate,
          commentType,
          contentLength: args.content.length,
        },
        report.orgId
      );
    }

    return commentId;
  },
});

/**
 * コメント更新 mutation
 * 権限: コメント作成者本人またはadmin
 * システムコメントは編集不可
 */
export const updateComment = mutation({
  args: {
    commentId: v.id('comments'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // コメント取得
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error('コメントが見つかりません');
    }

    // 関連する日報を取得
    const report = await ctx.db.get(comment.reportId);
    if (!report || report.isDeleted) {
      throw new Error('関連する日報が見つかりません');
    }

    // 権限チェック - コメント作成者本人またはadmin
    const user = await requireAuthentication(ctx);
    if (comment.authorId !== user._id && user.role !== 'admin') {
      throw new Error('コメントを編集する権限がありません');
    }

    // システムコメントは編集不可
    if (comment.type !== 'user') {
      throw new Error('システムコメントは編集できません');
    }

    // バリデーション
    if (!args.content || args.content.trim().length === 0) {
      throw new Error('コメント内容は必須です');
    }
    if (args.content.length > 2000) {
      throw new Error('コメントは2000文字以内で入力してください');
    }

    // 更新実行
    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
    });

    return { success: true };
  },
});

/**
 * コメント削除 mutation
 * 権限: コメント作成者本人またはadmin
 * システムコメントは削除不可
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, args) => {
    // コメント取得
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error('コメントが見つかりません');
    }

    // 関連する日報を取得
    const report = await ctx.db.get(comment.reportId);
    if (!report || report.isDeleted) {
      throw new Error('関連する日報が見つかりません');
    }

    // 権限チェック - コメント作成者本人またはadmin
    const user = await requireAuthentication(ctx);
    if (comment.authorId !== user._id && user.role !== 'admin') {
      throw new Error('コメントを削除する権限がありません');
    }

    // システムコメントは削除不可
    if (comment.type !== 'user') {
      throw new Error('システムコメントは削除できません');
    }

    // 削除実行
    await ctx.db.delete(args.commentId);

    // 監査ログ記録（adminによる削除のみ）
    if (user.role === 'admin' && comment.authorId !== user._id) {
      await logAuditEvent(
        ctx,
        user._id,
        'comment_deleted',
        {
          commentId: args.commentId,
          reportId: report._id,
          originalAuthorId: comment.authorId,
          commentType: comment.type,
        },
        report.orgId
      );
    }

    return { success: true };
  },
});

// ============================
// Queries
// ============================

/**
 * 日報一覧取得 query
 * 権限: viewer以上（組織メンバー）
 * ページネーション、フィルタリング、ソート対応
 */
export const listReports = query({
  args: {
    // ページネーション
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),

    // フィルタ
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('submitted'),
        v.literal('approved'),
        v.literal('rejected')
      )
    ),
    authorId: v.optional(v.id('userProfiles')),
    startDate: v.optional(v.string()), // YYYY-MM-DD
    endDate: v.optional(v.string()), // YYYY-MM-DD
    includeDeleted: v.optional(v.boolean()),

    // ソート
    sortBy: v.optional(
      v.union(
        v.literal('reportDate'),
        v.literal('created_at'),
        v.literal('updated_at'),
        v.literal('submittedAt')
      )
    ),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    // 読取権限チェック
    const user = await requireAuthentication(ctx);
    if (!user.orgId) {
      throw new Error('組織に所属していません');
    }

    const {
      limit = 20,
      cursor,
      status,
      authorId,
      startDate,
      endDate,
      sortBy = 'reportDate',
      sortOrder = 'desc',
    } = args;

    let query;

    // 最適化されたクエリパス
    if (status && sortBy === 'reportDate') {
      query = ctx.db
        .query('reports')
        .withIndex('by_org_status_date', (q) => q.eq('orgId', user.orgId!).eq('status', status));
    } else {
      // フォールバック/汎用クエリパス
      query = ctx.db.query('reports').withIndex('by_org', (q) => q.eq('orgId', user.orgId!));
    }

    if (authorId) {
      // `authorId` でのフィルタリングはインデックスを有効活用できないため、JS側で行う
      // Note: `by_org_author`インデックスがあるが、statusなど他の条件と組み合わせにくい
    }

    let reports = await query.order(sortOrder).collect();

    // JS側での追加フィルタリング
    if (authorId) {
      if (authorId !== user._id && user.role === 'user') {
        throw new Error('他のユーザーの日報を閲覧する権限がありません');
      }
      reports = reports.filter((r) => r.authorId === authorId);
    }
    if (startDate) {
      reports = reports.filter((r) => r.reportDate >= startDate);
    }
    if (endDate) {
      reports = reports.filter((r) => r.reportDate <= endDate);
    }
    if (!args.includeDeleted) {
      reports = reports.filter((r) => !r.isDeleted);
    }

    // JS側でのソート（インデックスでソートできない場合）
    if (sortBy !== 'reportDate' || !status) {
      reports.sort((a, b) => {
        const aValue = a[sortBy] ?? (sortBy === 'submittedAt' ? 0 : a.reportDate);
        const bValue = b[sortBy] ?? (sortBy === 'submittedAt' ? 0 : b.reportDate);
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    // ページネーションと作成者情報結合
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = reports.findIndex((r) => r._id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedReports = reports.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < reports.length;
    const nextCursor = hasMore ? paginatedReports[paginatedReports.length - 1]?._id : null;

    // N+1問題の解決: authorIdを収集し、一括で取得
    const authorIds: Id<'userProfiles'>[] = [
      ...new Set<Id<'userProfiles'>>(paginatedReports.map((r) => r.authorId)),
    ];
    const authors = new Map<Id<'userProfiles'>, Doc<'userProfiles'>>();
    if (authorIds.length > 0) {
      const authorDocs = await Promise.all(authorIds.map((id) => ctx.db.get(id)));
      for (const author of authorDocs) {
        if (author) {
          authors.set(author._id, author);
        }
      }
    }

    const getUserInfo = (id: Id<'userProfiles'>) => {
      const user = authors.get(id);
      return user
        ? {
            _id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
          }
        : null;
    };

    const reportsWithAuthors = paginatedReports.map((report) => {
      const author = authors.get(report.authorId);
      return {
        ...report,
        author: author
          ? {
              _id: author._id,
              name: author.name,
              avatarUrl: author.avatarUrl,
              role: author.role,
            }
          : null,
      };
    });

    return {
      reports: reportsWithAuthors,
      hasMore,
      nextCursor,
      totalCount: reports.length,
    };
  },
});

/**
 * 日報詳細取得 query
 * 権限: viewer以上（組織メンバー）
 * 関連データ（作成者、コメント、承認情報）を含む
 */
export const getReportDetail = query({
  args: {
    reportId: v.id('reports'),
  },
  handler: async (ctx, args) => {
    // レポート取得
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }

    // 読取権限チェック
    const user = await requireAuthentication(ctx);
    if (!user.orgId || user.orgId !== report.orgId) {
      throw new Error('この日報を閲覧する権限がありません');
    }

    // 自分以外の日報を見る場合はviewer以上の権限が必要
    if (report.authorId !== user._id && user.role === 'user') {
      // userロールは自分の日報のみ閲覧可能
      throw new Error('他のユーザーの日報を閲覧する権限がありません');
    }

    // コメントを取得（作成者情報付き）
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_report', (q) => q.eq('reportId', args.reportId))
      .collect();

    // 承認情報を取得
    const approvals = await ctx.db
      .query('approvals')
      .withIndex('by_report', (q) => q.eq('reportId', args.reportId))
      .collect();

    // 関連データのIDを収集
    const userIds = new Set<Id<'userProfiles'>>();
    userIds.add(report.authorId);
    comments.forEach((c) => c.authorId && userIds.add(c.authorId));
    approvals.forEach((a) => userIds.add(a.managerId));
    (report.editHistory ?? []).forEach((e) => userIds.add(e.editorId));
    if (report.deletedBy) {
      userIds.add(report.deletedBy);
    }

    // ユーザー情報を一括取得
    const userDocs = await Promise.all(Array.from(userIds).map((id) => ctx.db.get(id)));
    const usersById = new Map<string, Doc<'userProfiles'>>();
    for (const userDoc of userDocs) {
      if (userDoc) {
        usersById.set(userDoc._id, userDoc);
      }
    }

    const getUserInfo = (id: Id<'userProfiles'>) => {
      const user = usersById.get(id);
      return user
        ? {
            _id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
          }
        : null;
    };

    // データを結合
    const author = usersById.get(report.authorId);
    if (!author) {
      throw new Error('作成者情報が見つかりません');
    }

    const commentsWithAuthors = comments.map((comment) => ({
      ...comment,
      author: comment.authorId ? getUserInfo(comment.authorId) : null,
    }));

    const approvalsWithManagers = approvals.map((approval) => ({
      ...approval,
      manager: getUserInfo(approval.managerId),
    }));

    const editHistoryWithEditors = (report.editHistory ?? []).map((edit) => ({
      ...edit,
      editor: getUserInfo(edit.editorId),
    }));

    const deletedByUser = report.deletedBy ? getUserInfo(report.deletedBy) : null;

    // 統計情報を計算
    const stats = {
      totalTasks: report.tasks.length,
      completedTasks: report.tasks.filter((t) => t.completed).length,
      totalEstimatedHours: report.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0),
      totalActualHours: report.tasks.reduce((sum, t) => sum + (t.actualHours ?? 0), 0),
      commentCount: commentsWithAuthors.length,
      attachmentCount: report.attachments.length,
    };

    return {
      ...report,
      author: {
        _id: author._id,
        name: author.name,
        avatarUrl: author.avatarUrl,
        role: author.role,
        email: author.email,
      },
      comments: commentsWithAuthors.sort((a, b) => a.created_at - b.created_at),
      approvals: approvalsWithManagers,
      editHistory: editHistoryWithEditors,
      deletedBy: deletedByUser,
      stats,
    };
  },
});

/**
 * 自分の日報一覧取得 query
 * 権限: user以上
 * 自分が作成した日報のみを効率的に取得
 */
export const getMyReports = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('submitted'),
        v.literal('approved'),
        v.literal('rejected')
      )
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthentication(ctx);

    const { limit = 20, cursor, status, startDate, endDate } = args;

    // 自分の日報を取得
    let reports = await ctx.db
      .query('reports')
      .withIndex('by_author', (q) => q.eq('authorId', user._id))
      .collect();

    // 削除されていない日報のみ
    reports = reports.filter((r) => !r.isDeleted);

    // フィルタリング
    if (status) {
      reports = reports.filter((r) => r.status === status);
    }
    if (startDate) {
      reports = reports.filter((r) => r.reportDate >= startDate);
    }
    if (endDate) {
      reports = reports.filter((r) => r.reportDate <= endDate);
    }

    // 日付で降順ソート
    reports.sort((a, b) => b.reportDate.localeCompare(a.reportDate));

    // ページネーション
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = reports.findIndex((r) => r._id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedReports = reports.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < reports.length;
    const nextCursor = hasMore ? paginatedReports[paginatedReports.length - 1]?._id : null;

    return {
      reports: paginatedReports,
      hasMore,
      nextCursor,
      totalCount: reports.length,
    };
  },
});

/**
 * 日報の全文検索 query
 * 権限: viewer以上（組織メンバー）
 * titleとcontentを対象に検索
 */
export const searchReports = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    // 読取権限チェック
    const user = await requireAuthentication(ctx);
    if (!user.orgId) {
      throw new Error('組織に所属していません');
    }
    const { orgId } = user;

    if (!args.searchQuery) {
      return [];
    }

    // タイトルと内容で並行して検索
    const [reportsByTitle, reportsByContent] = await Promise.all([
      ctx.db
        .query('reports')
        .withSearchIndex('search_title', (q) =>
          q.search('title', args.searchQuery).eq('orgId', orgId)
        )
        .filter((q) => q.eq(q.field('isDeleted'), false))
        .take(100), // 上限を設定
      ctx.db
        .query('reports')
        .withSearchIndex('search_content', (q) =>
          q.search('content', args.searchQuery).eq('orgId', orgId)
        )
        .filter((q) => q.eq(q.field('isDeleted'), false))
        .take(100), // 上限を設定
    ]);

    // 結果をマージして重複を排除
    const reportsMap = new Map();
    for (const report of reportsByTitle) {
      reportsMap.set(report._id, report);
    }
    for (const report of reportsByContent) {
      reportsMap.set(report._id, report);
    }

    const combinedReports = Array.from(reportsMap.values());

    // 作成者情報を結合
    const reportsWithAuthors = await Promise.all(
      combinedReports.map(async (report) => {
        const author = (await ctx.db.get(report.authorId)) as Doc<'userProfiles'> | null;
        if (!author) {
          return {
            ...report,
            author: null,
          };
        }
        return {
          ...report,
          author: {
            _id: author._id,
            name: author.name,
            avatarUrl: author.avatarUrl,
            role: author.role,
          },
        };
      })
    );

    // 日付で降順ソート
    reportsWithAuthors.sort((a, b) => b.reportDate.localeCompare(a.reportDate));

    return reportsWithAuthors;
  },
});

// 型定義を追加
interface DashboardStatsData {
  date: string;
  submitted: number;
  approved: number;
}

/**
 * ダッシュボード用の統計情報取得 query
 * 権限: viewer以上（組織メンバー）
 * 過去30日間の日報提出状況を集計
 */
export const getDashboardStats = query({
  handler: async (ctx): Promise<DashboardStatsData[]> => {
    const user = await requireAuthentication(ctx);
    if (!user.orgId) {
      throw new Error('組織に所属していません');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

    const reports = await ctx.db
      .query('reports')
      .withIndex('by_org_created_status', (q) => q.eq('orgId', user.orgId!))
      .filter((q) => q.gt(q.field('created_at'), thirtyDaysAgoTimestamp))
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .order('asc')
      .collect();

    const dailyCounts: { [key: string]: { submitted: number; approved: number } } = {};

    for (const report of reports) {
      const [date] = new Date(report.created_at).toISOString().split('T');
      if (!dailyCounts[date]) {
        dailyCounts[date] = { submitted: 0, approved: 0 };
      }
      if (report.status === 'submitted' || report.status === 'approved') {
        dailyCounts[date].submitted++;
      }
      if (report.status === 'approved') {
        dailyCounts[date].approved++;
      }
    }

    // Sort dates and fill missing dates with 0
    const sortedDates = Object.keys(dailyCounts).sort();
    const result: DashboardStatsData[] = [];
    if (sortedDates.length > 0) {
      const startDate = new Date(sortedDates[0]);
      const endDate = new Date(sortedDates[sortedDates.length - 1]);
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const [dateStr] = d.toISOString().split('T');
        result.push({
          date: dateStr,
          ...(dailyCounts[dateStr] || { submitted: 0, approved: 0 }),
        });
      }
    }

    return result;
  },
});
