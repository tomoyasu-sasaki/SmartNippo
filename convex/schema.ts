import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Organizations table - multi-tenant base
  orgs: defineTable({
    name: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
    created_at: v.number(), // Unix timestamp
    updated_at: v.number(),
  })
    .index('by_created_at', ['created_at'])
    .index('by_plan', ['plan']),

  // User profiles table - simplified without auth dependency
  userProfiles: defineTable({
    email: v.optional(v.string()), // Optional for backward compatibility
    userId: v.optional(v.string()), // Legacy field for backward compatibility
    tokenIdentifier: v.optional(v.string()), // Clerk token identifier
    name: v.string(),
    role: v.union(
      v.literal('viewer'), // 読取専用
      v.literal('user'), // 自分の日報CRUD
      v.literal('manager'), // チーム日報閲覧/承認
      v.literal('admin') // 全操作 + org設定
    ),
    orgId: v.optional(v.id('orgs')), // Optional for initial user creation
    avatarUrl: v.optional(v.string()), // External URL (legacy support)
    avatarStorageId: v.optional(v.id('_storage')), // Convex File Storage ID
    pushToken: v.optional(v.string()), // Expo push notification token
    // Social links
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
    // Privacy settings
    privacySettings: v.optional(
      v.object({
        profile: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        email: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        socialLinks: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        reports: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
        avatar: v.optional(
          v.union(
            v.literal('public'),
            v.literal('organization'),
            v.literal('team'),
            v.literal('private')
          )
        ),
      })
    ),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_token', ['tokenIdentifier'])
    .index('by_org', ['orgId'])
    .index('by_org_role', ['orgId', 'role'])
    .index('by_created_at', ['created_at']),

  // Reports table - core daily report functionality (Enhanced)
  reports: defineTable({
    authorId: v.id('userProfiles'),
    reportDate: v.string(), // YYYY-MM-DD format
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
    tasks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        completed: v.boolean(),
        priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
        estimatedHours: v.optional(v.number()), // 予定工数 - 強化項目
        actualHours: v.optional(v.number()), // 実績工数 - 強化項目
        category: v.optional(v.string()), // タスクカテゴリ - 強化項目
      })
    ),
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
      workingHours: v.optional(v.number()), // in minutes
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
    }),

  // Comments table - user/system/AI feedback
  comments: defineTable({
    reportId: v.id('reports'),
    authorId: v.optional(v.id('userProfiles')), // nullable for system/AI comments
    content: v.string(),
    type: v.union(
      v.literal('user'), // ユーザーコメント
      v.literal('system'), // システム自動生成
      v.literal('ai') // AI生成コメント/提案
    ),
    created_at: v.number(),
  })
    .index('by_report', ['reportId'])
    .index('by_report_type', ['reportId', 'type'])
    .index('by_author', ['authorId'])
    .index('by_created_at', ['created_at']),

  // Approvals table - manager approval tracking
  approvals: defineTable({
    reportId: v.id('reports'),
    managerId: v.id('userProfiles'), // manager/admin role required
    approved_at: v.number(),
  })
    .index('by_report', ['reportId'])
    .index('by_manager', ['managerId'])
    .index('by_approval_time', ['approved_at']),

  // Audit logs table - compliance & monitoring
  audit_logs: defineTable({
    actor_id: v.id('userProfiles'),
    action: v.string(), // approveReport, deleteReport, etc.
    payload: v.any(), // JSON object with action details
    created_at: v.number(),
    org_id: v.id('orgs'), // RLS: org-based isolation
  })
    .index('by_org', ['org_id'])
    .index('by_actor', ['actor_id'])
    .index('by_org_action', ['org_id', 'action'])
    .index('by_created_at', ['created_at']),

  // Schema versions table - migration management
  schema_versions: defineTable({
    version: v.number(),
    name: v.string(),
    description: v.string(),
    appliedAt: v.number(),
    rollbackScript: v.optional(v.string()),
  })
    .index('by_version', ['version'])
    .index('by_applied_at', ['appliedAt']),
});
