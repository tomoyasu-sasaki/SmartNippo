// ========================================
// Error types
// ========================================

// 基本的なエラー型
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

// APIエラーレスポンス型
export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  status: number;
}

// エラーコード定義
export const ErrorCodes = {
  // 認証関連
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // バリデーション関連
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // リソース関連
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // サーバー関連
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // ネットワーク関連
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
