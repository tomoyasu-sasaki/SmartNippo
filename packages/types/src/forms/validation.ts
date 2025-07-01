// ========================================
// Validation types
// ========================================

// レポート作成時のバリデーションエラー型
export interface ReportValidationErrors {
  title?: string;
  content?: string;
  reportDate?: string;
  workItems?: string;
  metadata?: string;
}

// 汎用的なバリデーション結果型
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// バリデーションルールの型
export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

// フィールドバリデーション設定
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidationRule[];
}
