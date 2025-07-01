// ========================================
// Report component props types
// ========================================

import type {
  Approval,
  Comment,
  Report,
  ReportStats,
  UserProfile,
  WorkItem,
} from '../core/entities';
import type { CommentType } from '../core/enums';

// レポートカードコンポーネントのProps型
export interface ReportCardProps {
  report: Report & {
    author?: Pick<UserProfile, 'name'>;
  };
  onClick?: () => void;
}

// コメントアイテムコンポーネントのProps型
export interface CommentItemProps {
  comment: Comment & {
    author?: Pick<UserProfile, 'name' | 'avatarUrl'>;
  };
}

// 作業項目フォームコンポーネントのProps型
export interface WorkItemFormProps {
  workItem: WorkItem;
  onUpdate: (workItem: WorkItem) => void;
  onDelete: () => void;
}

// 作業項目リストアイテムコンポーネントのProps型
export interface WorkItemListItemProps {
  workItem: WorkItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

// メタデータ入力コンポーネントのProps型
export interface MetadataInputProps {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

// メタデータセクションコンポーネントのProps型
export interface MetadataSectionProps {
  title: string;
  items: string[];
}

// レポートフィルターの型定義
export interface ReportFilter {
  status?: Report['status'] | null;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// レポート詳細表示用の型定義
export interface ReportDetail extends Report {
  author: UserProfile;
  comments: Array<
    Comment & {
      author?: UserProfile;
    }
  >;
  approvals?: Array<
    Approval & {
      manager?: UserProfile | null;
      status: 'pending' | 'approved' | 'rejected';
    }
  >;
  stats: ReportStats;
}

// レポート一覧表示用の型定義
export interface ReportListItem extends Report {
  author: UserProfile;
}

// レポート詳細コンポーネントのProps
export interface ReportDetailProps {
  reportId: string;
}

// レポートエディターラッパーのProps
export interface ReportEditorWrapperProps {
  params: {
    id: string;
  };
}

// レポートエディターのProps
export interface ReportEditorProps {
  reportId?: string;
  initialData?: Omit<Partial<Report>, 'reportDate'> & { reportDate?: Date };
  expectedUpdatedAt?: number;
  onSave?: (data: Partial<Report>) => void;
  onCancel?: () => void;
}

// ステータスバッジのProps (webから追加)
export interface StatusBadgeProps {
  status: Report['status'];
  className?: string;
}

// Web用のレポートカード拡張Props
export interface WebReportCardProps {
  id: string;
  title: string;
  content: string;
  status: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  url?: string;
  className?: string;
}

// Web用のコメントアイテム拡張Props
export interface WebCommentItemProps {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  type: CommentType;
  url?: string;
}
