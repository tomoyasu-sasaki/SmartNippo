// Convex-specific exports

// Type aliases
export * from './aliases';

// Hook関連の型定義（共通）
export interface MutationOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}
