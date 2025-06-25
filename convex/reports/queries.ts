/**
 * @fileoverview 日報データ取得クエリ
 *
 * @description 日報の取得に関する多様なクエリ関数を提供します。
 * 日報の詳細取得、一覧取得（ページネーション、フィルタ、ソート対応）、
 * 編集用データ取得、自分の日報一覧、全文検索などの機能を含みます。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import { query } from '../_generated/server';
import { requireAuthentication, requireOwnershipOrManagerRole } from '../auth/auth';

// ============================
// Queries
// ============================

/**
 * 編集用日報データの取得
 *
 * @description 指定された日報を編集用に取得します。
 * 削除済みの日報は取得できず、作成者本人または管理者・マネージャーのみがアクセス可能です。
 *
 * @query
 * @param {Object} args - クエリパラメータ
 * @param {Id<'reports'>} args.reportId - 編集対象の日報ID
 * @returns {Promise<ReportWithAuthor | null>} 著者情報を含む日報データ、またはnull
 * @throws {Error} 権限不足の場合
 * @example
 * ```typescript
 * const reportData = await getReportForEdit({ reportId: 'report123' });
 * if (reportData) {
 *   // 編集フォームにデータを設定
 * }
 * ```
 * @since 1.0.0
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
 * 日報一覧の取得（多機能）
 *
 * @description ページネーション、フィルタリング、ソート機能を備えた日報一覧取得クエリ。
 * 組織メンバーであれば誰でも閲覧可能ですが、一般ユーザーは他のユーザーの日報をフィルタできません。
 *
 * @query
 * @param {Object} args - クエリパラメータ
 * @param {number} [args.limit=20] - 取得件数
 * @param {string} [args.cursor] - ページネーションカーソル
 * @param {'draft'|'submitted'|'approved'|'rejected'} [args.status] - ステータスフィルタ
 * @param {Id<'userProfiles'>} [args.authorId] - 作成者フィルタ
 * @param {string} [args.startDate] - 開始日フィルタ (YYYY-MM-DD)
 * @param {string} [args.endDate] - 終了日フィルタ (YYYY-MM-DD)
 * @param {boolean} [args.includeDeleted=false] - 削除済みを含めるか
 * @param {'reportDate'|'created_at'|'updated_at'|'submittedAt'} [args.sortBy='reportDate'] - ソート基準
 * @param {'asc'|'desc'} [args.sortOrder='desc'] - ソート順序
 * @returns {Promise<Object>} 日報一覧とページネーション情報
 * @throws {Error} 認証失敗、組織未所属、または権限不足の場合
 * @example
 * ```typescript
 * const result = await listReports({
 *   status: 'approved',
 *   sortBy: 'updated_at',
 *   limit: 10
 * });
 * console.log(`Found ${result.totalCount} approved reports`);
 * ```
 * @since 1.0.0
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
 * 日報詳細情報の取得
 *
 * @description 指定された日報の詳細情報を、関連データ（作成者、コメント、承認情報、編集履歴など）
 * を含めて取得します。組織メンバーは誰でも閲覧可能です。
 *
 * @query
 * @param {Object} args - クエリパラメータ
 * @param {Id<'reports'>} args.reportId - 詳細取得対象の日報ID
 * @returns {Promise<ReportDetail>} 関連情報と統計を含む詳細な日報データ
 * @throws {Error} 日報が見つからない、または閲覧権限がない場合
 * @example
 * ```typescript
 * const detail = await getReportDetail({ reportId: 'report123' });
 * console.log(`Title: ${detail.title}`);
 * console.log(`Comments: ${detail.comments.length}`);
 * console.log(`Approvals: ${detail.approvals.length}`);
 * ```
 * @since 1.0.0
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
    (report.editHistory ?? []).forEach((e: { editorId: Id<'userProfiles'> }) =>
      userIds.add(e.editorId)
    );
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

    const editHistoryWithEditors = (report.editHistory ?? []).map(
      (edit: { editedAt: number; editorId: Id<'userProfiles'>; changes: string }) => ({
        ...edit,
        editor: getUserInfo(edit.editorId),
      })
    );

    const deletedByUser = report.deletedBy ? getUserInfo(report.deletedBy) : null;

    // 統計情報を計算
    const stats = {
      totalTasks: report.tasks.length,
      completedTasks: report.tasks.filter((t: { completed: boolean }) => t.completed).length,
      totalEstimatedHours: report.tasks.reduce(
        (sum: number, t: { estimatedHours?: number }) => sum + (t.estimatedHours ?? 0),
        0
      ),
      totalActualHours: report.tasks.reduce(
        (sum: number, t: { actualHours?: number }) => sum + (t.actualHours ?? 0),
        0
      ),
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
 * 自分の日報一覧の取得
 *
 * @description 現在認証されているユーザーが作成した日報の一覧を効率的に取得します。
 * ステータスや期間でのフィルタリングが可能です。
 *
 * @query
 * @param {Object} args - クエリパラメータ
 * @param {number} [args.limit=20] - 取得件数
 * @param {string} [args.cursor] - ページネーションカーソル
 * @param {'draft'|'submitted'|'approved'|'rejected'} [args.status] - ステータスフィルタ
 * @param {string} [args.startDate] - 開始日フィルタ (YYYY-MM-DD)
 * @param {string} [args.endDate] - 終了日フィルタ (YYYY-MM-DD)
 * @returns {Promise<Object>} 自分の日報一覧とページネーション情報
 * @throws {Error} 認証されていない場合
 * @example
 * ```typescript
 * const myDrafts = await getMyReports({ status: 'draft' });
 * console.log(`You have ${myDrafts.totalCount} draft reports.`);
 * ```
 * @since 1.0.0
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
 * 日報の全文検索
 *
 * @description 日報のタイトルと内容を対象に全文検索を実行します。
 * 組織内の削除されていない日報のみが検索対象となります。
 *
 * @query
 * @param {Object} args - クエリパラメータ
 * @param {string} args.searchQuery - 検索キーワード
 * @returns {Promise<ReportWithAuthor[]>} 検索結果の日報配列（作成者情報付き）
 * @throws {Error} 認証失敗または組織未所属の場合
 * @example
 * ```typescript
 * const results = await searchReports({ searchQuery: 'React' });
 * console.log(`Found ${results.length} reports mentioning "React".`);
 * ```
 * @since 1.0.0
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
