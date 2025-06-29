import type { ImageResult } from './common';
import type { Comment, Report, UserProfile, WorkItem } from './index';

// AvatarPickerコンポーネントのProps型
export interface AvatarPickerProps {
  currentAvatarUrl?: string;
  onImageSelected: (result: ImageResult) => void;
  size?: number;
  disabled?: boolean;
}

// ステップインジケーターのProps型
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

// タスクアイテムコンポーネントのProps型
export interface WorkItemFormProps {
  workItem: WorkItem;
  onUpdate: (workItem: WorkItem) => void;
  onDelete: () => void;
}

// メタデータ入力コンポーネントのProps型
export interface MetadataInputProps {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

// フィルターチップコンポーネントのProps型
export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// レポートカードコンポーネントのProps型
export interface ReportCardProps {
  report: Report & {
    author?: Pick<UserProfile, 'name'>;
  };
}

// コメントアイテムコンポーネントのProps型
export interface CommentItemProps {
  comment: Comment & {
    author?: Pick<UserProfile, 'name'>;
  };
}

// タスクリストアイテムコンポーネントのProps型
export interface WorkItemListItemProps {
  workItem: WorkItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

// メタデータセクションコンポーネントのProps型
export interface MetadataSectionProps {
  title: string;
  items: string[];
}

// 画像設定の型定義
export interface ImageSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: string;
}

// 権限ステータスの型定義
export interface PermissionStatus {
  cameraStatus: string;
  libraryStatus: string;
}

// Report List Item Props
export interface ReportListItemProps {
  report: Report & {
    author: Pick<UserProfile, 'name'>;
  };
}
