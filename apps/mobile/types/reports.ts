import type { Doc, Id } from 'convex/_generated/dataModel';

// Convexのスキーマから型を派生
export type Report = Doc<'reports'>;
export type ReportId = Id<'reports'>;
export type Comment = Doc<'comments'>;
export type Approval = Doc<'approvals'>;
export type WorkItem = Doc<'workItems'>;

// レポートのメタデータ型定義（Convexスキーマに基づく）
export type ReportMetadata = NonNullable<Report['metadata']>;

// レポート作成フォームデータの型定義
export interface ReportFormData {
  reportDate: string;
  title: string;
  content: string;
  workingHours: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  workItems: Array<
    Partial<WorkItem> & {
      _id?: string; // for client-side key
      projectId: string;
      workCategoryId: string;
      description: string;
      workDuration: number;
    }
  >;
  metadata: {
    mood?: 'positive' | 'neutral' | 'negative';
    location?: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    achievements?: string[];
    challenges?: string[];
    learnings?: string[];
    nextActionItems?: string[];
  };
}

// レポート統計情報の型定義
export interface ReportStats {
  workItemCount: number;
  totalWorkDuration: number; // in minutes
  commentCount: number;
}

// レポート作成時のバリデーションエラー型
export interface ReportValidationErrors {
  title?: string;
  content?: string;
  reportDate?: string;
  workItems?: string;
  metadata?: string;
}

// レポート詳細表示用の型定義（Convexのクエリ結果を想定）
export interface ReportDetail extends Report {
  author: Doc<'userProfiles'>;
  comments: Array<
    Comment & {
      author?: Doc<'userProfiles'>;
    }
  >;
  approvals?: Array<
    Approval & {
      manager: Doc<'userProfiles'>;
    }
  >;
  stats: ReportStats;
}

// レポートコメントの型定義
export interface ReportComment {
  _id: string;
  content: string;
  type: 'user' | 'system' | 'ai';
  author?: {
    _id: string;
    name: string;
    email: string;
  };
  created_at: string;
}

// レポート承認の型定義
export interface ReportApproval {
  _id: string;
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  comment?: string;
  approved_at: string;
}

// レポート一覧表示用の型定義
export interface ReportListItem extends Report {
  author: Doc<'userProfiles'>;
}

// レポートフィルターの型定義
export interface ReportFilter {
  status?: Report['status'] | null;
  author?: Id<'userProfiles'>;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
