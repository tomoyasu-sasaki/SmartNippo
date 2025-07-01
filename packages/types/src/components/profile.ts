// ========================================
// Profile component props types
// ========================================

// アバターアップロードコンポーネントのProps
export interface AvatarUploadProps {
  avatarUrl?: string;
  onUpload: (result: {
    url: string;
    storageId?: string;
    fileSize?: number;
    fileType?: string;
  }) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSize?: number;
  className?: string;
}
