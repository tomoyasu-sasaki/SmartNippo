// ========================================
// Common component props types
// ========================================

// 画像結果の型定義
export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  fileName?: string;
}

// AvatarPickerコンポーネントのProps型
export interface AvatarPickerProps {
  currentAvatarUrl?: string;
  onImageSelected: (result: ImageResult) => void;
  size?: number;
  disabled?: boolean;
}

// アバターアップロード結果の型定義
export interface AvatarUploadResult {
  url?: string;
  storageId: string;
  fileSize: number;
  fileType: string;
  fileName?: string;
}

// ステップインジケーターのProps型
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

// フィルターチップコンポーネントのProps型
export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// ネットワーク状態
export type NetworkStatus = boolean | null;

// 画像設定
export interface ImageSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: string;
}

// パーミッション状態
export interface PermissionStatus {
  cameraStatus: string;
  libraryStatus: string;
}

// 共通のローディング関連Props
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface LoadingOverlayProps {
  isLoading?: boolean;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}
