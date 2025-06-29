/**
 * @fileoverview 日報テーブルのスキーマ定義
 *
 * @property {Id<'userProfiles'>} authorId - 作成者のID
 * @property {string} reportDate - 日報の日付 (YYYY-MM-DD形式)
 * @property {object | undefined} workingHours - 勤務時間オブジェクト
 * @property {number} workingHours.startHour - 開始 時
 * @property {number} workingHours.startMinute - 開始 分
 * @property {number} workingHours.endHour - 終了 時
 * @property {number} workingHours.endMinute - 終了 分
 * @property {string} title - タイトル
 * @property {string} content - 内容
 * @property {'draft' | 'submitted' | 'approved' | 'rejected'} status - ステータス
 * @property {string | undefined} summary - AIによる要約
 * @property {'pending' | 'processing' | 'completed' | 'failed' | undefined} aiSummaryStatus - AI要約の処理状況
 * @property {Array<object>} attachments - 添付ファイルの配列
 * @property {object} metadata - その他のメタデータ
 * @property {number | undefined} submittedAt - 提出日時
 * @property {number | undefined} approvedAt - 承認日時
 * @property {number | undefined} rejectedAt - 却下日時
 * @property {string | undefined} rejectionReason - 却下理由
 * @property {Array<object> | undefined} editHistory - 編集履歴
 * @property {boolean} isDeleted - 削除フラグ
 * @property {number | undefined} deletedAt - 削除日時
 * @property {Id<'userProfiles'> | undefined} deletedBy - 削除者のID
 * @property {Id<'orgs'>} orgId - 所属組織ID
 * @property {number} created_at - 作成日時
 * @property {number} updated_at - 更新日時
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * 日報テーブル (reports)
 * @description 中核機能である日報データを管理します。AI要約、タスク、添付ファイルなどの拡張機能を持ちます。
 */
export const reportsTable = defineTable({
  authorId: v.id('userProfiles'),
  reportDate: v.string(), // YYYY-MM-DD format
  workingHours: v.optional(
    v.object({
      startHour: v.number(),
      startMinute: v.number(),
      endHour: v.number(),
      endMinute: v.number(),
    })
  ), // 勤務時間
  title: v.string(),
  content: v.string(),
  status: v.union(
    v.literal('draft'), // 下書き
    v.literal('submitted'), // 提出済み
    v.literal('approved'), // 承認済み
    v.literal('rejected') // 却下 - 強化項目
  ),
  summary: v.optional(v.string()), // AI-generated summary
  aiSummaryStatus: v.optional(
    v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    )
  ), // AI要約処理状況 - 強化項目
  attachments: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      url: v.optional(v.string()), // External URL (legacy support)
      storageId: v.optional(v.id('_storage')), // Convex File Storage ID
      size: v.number(),
      type: v.string(), // MIME type
      uploadedAt: v.number(), // アップロード日時 - 強化項目
      description: v.optional(v.string()), // ファイル説明 - 強化項目
    })
  ),
  metadata: v.object({
    mood: v.optional(v.union(v.literal('positive'), v.literal('neutral'), v.literal('negative'))),
    location: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // 強化項目
    version: v.optional(v.number()), // レポートバージョン
    previousReportId: v.optional(v.id('reports')), // 前回日報への参照
    template: v.optional(v.string()), // 使用テンプレート名
    difficulty: v.optional(v.union(v.literal('easy'), v.literal('medium'), v.literal('hard'))),
    achievements: v.optional(v.array(v.string())), // 成果・達成事項
    challenges: v.optional(v.array(v.string())), // 課題・困った点
    learnings: v.optional(v.array(v.string())), // 学んだこと
    nextActionItems: v.optional(v.array(v.string())), // 次のアクションアイテム
  }),
  // 強化項目
  submittedAt: v.optional(v.number()), // 提出日時
  approvedAt: v.optional(v.number()), // 承認日時
  rejectedAt: v.optional(v.number()), // 却下日時
  rejectionReason: v.optional(v.string()), // 却下理由
  editHistory: v.optional(
    v.array(
      v.object({
        editedAt: v.number(),
        editorId: v.id('userProfiles'),
        changes: v.string(), // 変更内容の説明
      })
    )
  ), // 編集履歴
  isDeleted: v.boolean(),
  deletedAt: v.optional(v.number()), // 削除日時
  deletedBy: v.optional(v.id('userProfiles')), // 削除者
  orgId: v.id('orgs'), // RLS: org-based isolation
  created_at: v.number(),
  updated_at: v.number(),
  // [LEGACY] tasks フィールド (旧スキーマ互換用)
  tasks: v.optional(v.array(v.any())),
})
  .index('by_org', ['orgId'])
  .index('by_author', ['authorId'])
  .index('by_org_author', ['orgId', 'authorId'])
  .index('by_org_date', ['orgId', 'reportDate'])
  .index('by_org_status', ['orgId', 'status'])
  .index('by_org_not_deleted', ['orgId', 'isDeleted'])
  .index('by_author_date', ['authorId', 'reportDate'])
  .index('by_created_at', ['created_at'])
  // 強化インデックス - パフォーマンス最適化
  .index('by_org_submitted', ['orgId', 'submittedAt'])
  .index('by_org_approved', ['orgId', 'approvedAt'])
  .index('by_org_status_date', ['orgId', 'status', 'reportDate'])
  .index('by_ai_summary_status', ['aiSummaryStatus'])
  .index('by_org_ai_summary', ['orgId', 'aiSummaryStatus'])
  .index('by_author_status', ['authorId', 'status'])
  .index('by_org_deleted_at', ['orgId', 'deletedAt'])
  // 時系列分析最適化
  .index('by_org_created_status', ['orgId', 'created_at', 'status'])
  .index('by_author_date_status', ['authorId', 'reportDate', 'status'])
  .index('by_org_updated_status', ['orgId', 'updated_at', 'status'])
  // 管理画面・分析用
  .index('by_org_author_created', ['orgId', 'authorId', 'created_at'])
  .index('by_status_org_date', ['status', 'orgId', 'reportDate'])
  // AI機能最適化
  .index('by_summary_exists', ['orgId', 'summary'])
  .index('by_org_ai_created', ['orgId', 'aiSummaryStatus', 'created_at'])
  // 全文検索用インデックス
  .searchIndex('search_title', {
    searchField: 'title',
    filterFields: ['orgId'],
  })
  .searchIndex('search_content', {
    searchField: 'content',
    filterFields: ['orgId'],
  });
