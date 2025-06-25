/**
 * @fileoverview 共通バリデーション機能
 *
 * @description アプリケーション全体で使用される共通のバリデーション型定義と関数を提供します。
 * エラーハンドリング、フィールド検証、フォーマットチェックなどの基本的なバリデーション機能を管理します。
 *
 * @since 1.0.0
 */

/**
 * バリデーションエラー情報
 *
 * @description 個別のバリデーションエラーの詳細情報を格納するインターフェース。
 * エラーが発生したフィールド、メッセージ、エラーコード、不正な値などを記録します。
 *
 * @interface
 * @example
 * ```typescript
 * const error: ValidationError = {
 *   field: 'email',
 *   message: 'Invalid email format',
 *   code: 'INVALID_FORMAT',
 *   value: 'invalid-email'
 * };
 * ```
 * @since 1.0.0
 */
export interface ValidationError {
  /** エラーが発生したフィールド名 */
  field: string;
  /** ユーザー向けエラーメッセージ */
  message: string;
  /** プログラム処理用エラーコード */
  code: string;
  /** バリデーションに失敗した値（オプション） */
  value?: any;
}

/**
 * バリデーション結果
 *
 * @description バリデーション処理の結果を格納するインターフェース。
 * 検証が成功したかどうかの判定と、発生したエラーの一覧を提供します。
 *
 * @interface
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   isValid: false,
 *   errors: [
 *     { field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' }
 *   ]
 * };
 * ```
 * @since 1.0.0
 */
export interface ValidationResult {
  /** バリデーションが成功したかどうか */
  isValid: boolean;
  /** 発生したバリデーションエラーの配列 */
  errors: ValidationError[];
}

/**
 * メールアドレスの妥当性検証
 *
 * @description メールアドレスの形式、文字数制限、必須チェックを行います。
 * RFC 5322 に準拠した基本的な形式チェックと実用的な制限を適用します。
 *
 * @param {string} email - 検証するメールアドレス
 * @returns {ValidationError[]} 検証エラーの配列（エラーがない場合は空配列）
 * @example
 * ```typescript
 * const errors = validateEmail('user@example.com');
 * if (errors.length === 0) {
 *   console.log('Valid email');
 * } else {
 *   console.log('Invalid email:', errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  } else if (!emailRegex.test(email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT',
      value: email,
    });
  } else if (email.length > 254) {
    errors.push({
      field: 'email',
      message: 'Email too long (max 254 characters)',
      code: 'TOO_LONG',
      value: email,
    });
  }

  return errors;
};

/**
 * 名前・テキストフィールドの妥当性検証
 *
 * @description 名前やタイトルなどのテキストフィールドの文字数、必須チェック、
 * 使用可能文字の検証を行います。一般的なテキスト入力に対する包括的な検証機能を提供します。
 *
 * @param {string} name - 検証するテキスト値
 * @param {string} fieldName - フィールド名（エラーメッセージで使用）
 * @returns {ValidationError[]} 検証エラーの配列（エラーがない場合は空配列）
 * @example
 * ```typescript
 * const errors = validateName('John Doe', 'userName');
 * if (errors.length === 0) {
 *   console.log('Valid name');
 * } else {
 *   console.log('Invalid name:', errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateName = (name: string, fieldName: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({ field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' });
  } else if (name.length < 2) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be at least 2 characters`,
      code: 'TOO_SHORT',
      value: name,
    });
  } else if (name.length > 100) {
    errors.push({
      field: fieldName,
      message: `${fieldName} too long (max 100 characters)`,
      code: 'TOO_LONG',
      value: name,
    });
  } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(name)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} contains invalid characters`,
      code: 'INVALID_FORMAT',
      value: name,
    });
  }

  return errors;
};

/**
 * URL の妥当性検証
 *
 * @description URL の形式、文字数制限、必須チェックを行います。
 * 標準的な URL 形式チェックと実用的な制限を適用し、Webアプリケーションで安全に使用できることを確認します。
 *
 * @param {string} url - 検証する URL
 * @param {string} fieldName - フィールド名（エラーメッセージで使用）
 * @param {boolean} [required=false] - 必須フィールドかどうか
 * @returns {ValidationError[]} 検証エラーの配列（エラーがない場合は空配列）
 * @example
 * ```typescript
 * const errors = validateUrl('https://example.com', 'websiteUrl', true);
 * if (errors.length === 0) {
 *   console.log('Valid URL');
 * } else {
 *   console.log('Invalid URL:', errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateUrl = (
  url: string,
  fieldName: string,
  required = false
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!url && required) {
    errors.push({ field: fieldName, message: `${fieldName} is required`, code: 'REQUIRED' });
  } else if (url && url.length > 0) {
    try {
      new URL(url);
      if (url.length > 2048) {
        errors.push({
          field: fieldName,
          message: `${fieldName} too long (max 2048 characters)`,
          code: 'TOO_LONG',
          value: url,
        });
      }
    } catch {
      errors.push({
        field: fieldName,
        message: `${fieldName} is not a valid URL`,
        code: 'INVALID_FORMAT',
        value: url,
      });
    }
  }

  return errors;
};
