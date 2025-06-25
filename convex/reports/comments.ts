/**
 * @fileoverview レポートコメント機能
 *
 * @description 日報に対するコメントの追加、更新、削除を行うMutation関数を提供します。
 * 権限チェックと監査ログ記録を含み、安全なコミュニケーション機能を実現します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { logAuditEvent, requireAuthentication } from '../auth/auth';

// ============================
// Comment Mutations
// ============================

/**
 * 日報へのコメント追加
 *
 * @description 指定された日報に新しいコメントを追加します。
 * ユーザーは自身の所属する組織の日報にのみコメントできます。
 * コメント内容は必須で、1000文字の制限があります。
 *
 * @mutation
 * @param {Object} args - コメント情報
 * @param {Id<'reports'>} args.reportId - コメント対象の日報ID
 * @param {string} args.content - コメント内容
 * @returns {Promise<Id<'comments'>>} 作成されたコメントのID
 * @throws {Error} 認証失敗、日報が見つからない、権限不足、またはバリデーション違反の場合
 * @example
 * ```typescript
 * const commentId = await addComment({
 *   reportId: 'report123',
 *   content: '素晴らしい内容ですね！'
 * });
 * console.log('Comment added with ID:', commentId);
 * ```
 * @since 1.0.0
 */
export const addComment = mutation({
  args: {
    reportId: v.id('reports'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // 認証チェック
    const user = await requireAuthentication(ctx);

    // レポート取得と権限チェック
    const report = await ctx.db.get(args.reportId);
    if (!report || report.isDeleted) {
      throw new Error('日報が見つかりません');
    }
    if (report.orgId !== user.orgId) {
      throw new Error('この日報にコメントする権限がありません');
    }

    // バリデーション
    if (!args.content || args.content.trim().length === 0) {
      throw new Error('コメント内容は必須です');
    }
    if (args.content.length > 1000) {
      throw new Error('コメントは1000文字以内で入力してください');
    }

    // コメント作成
    const commentId = await ctx.db.insert('comments', {
      reportId: args.reportId,
      authorId: user._id,
      content: args.content.trim(),
      type: 'user',
      created_at: Date.now(),
    });

    // 日報の更新日時を更新
    await ctx.db.patch(args.reportId, {
      updated_at: Date.now(),
    });

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'comment_added',
      {
        commentId,
        reportId: args.reportId,
        reportTitle: report.title,
        content: args.content,
      },
      user.orgId!
    );

    return commentId;
  },
});

/**
 * コメントの更新
 *
 * @description 既存のコメント内容を更新します。
 * コメントを作成したユーザー本人のみが更新可能です。
 *
 * @mutation
 * @param {Object} args - 更新情報
 * @param {Id<'comments'>} args.commentId - 更新対象のコメントID
 * @param {string} args.content - 新しいコメント内容
 * @returns {Promise<{success: boolean}>} 更新成功を示すオブジェクト
 * @throws {Error} 認証失敗、コメントが見つからない、権限不足、またはバリデーション違反の場合
 * @example
 * ```typescript
 * await updateComment({
 *   commentId: 'comment456',
 *   content: '訂正：素晴らしい内容でした。'
 * });
 * ```
 * @since 1.0.0
 */
export const updateComment = mutation({
  args: {
    commentId: v.id('comments'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // 認証チェック
    const user = await requireAuthentication(ctx);

    // コメント取得
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error('コメントが見つかりません');
    }

    // 権限チェック - 作成者本人のみ
    if (comment.authorId !== user._id) {
      throw new Error('自分のコメントのみ編集できます');
    }

    // バリデーション
    if (!args.content || args.content.trim().length === 0) {
      throw new Error('コメント内容は必須です');
    }
    if (args.content.length > 1000) {
      throw new Error('コメントは1000文字以内で入力してください');
    }

    // 更新実行
    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
    });

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'comment_updated',
      {
        commentId: args.commentId,
        reportId: comment.reportId,
        oldContent: comment.content,
        newContent: args.content,
      },
      user.orgId!
    );

    return { success: true };
  },
});

/**
 * コメントの削除
 *
 * @description 既存のコメントを物理削除します。
 * コメントを作成したユーザー本人、または管理者権限を持つユーザーのみが削除可能です。
 *
 * @mutation
 * @param {Object} args - 削除情報
 * @param {Id<'comments'>} args.commentId - 削除対象のコメントID
 * @returns {Promise<{success: boolean}>} 削除成功を示すオブジェクト
 * @throws {Error} 認証失敗、コメントまたは関連日報が見つからない、または権限不足の場合
 * @example
 * ```typescript
 * await deleteComment({ commentId: 'comment789' });
 * ```
 * @since 1.0.0
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, args) => {
    // 認証チェック
    const user = await requireAuthentication(ctx);

    // コメント取得
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error('コメントが見つかりません');
    }

    // レポート取得（組織IDのため）
    const report = await ctx.db.get(comment.reportId);
    if (!report) {
      throw new Error('関連する日報が見つかりません');
    }

    // 権限チェック - 作成者本人またはadmin
    if (comment.authorId !== user._id && user.role !== 'admin') {
      throw new Error('コメントを削除する権限がありません');
    }

    // 物理削除実行
    await ctx.db.delete(args.commentId);

    // 監査ログ記録
    await logAuditEvent(
      ctx,
      user._id,
      'comment_deleted',
      {
        commentId: args.commentId,
        reportId: comment.reportId,
        content: comment.content,
        originalAuthorId: comment.authorId,
      },
      report.orgId
    );

    return { success: true };
  },
});
