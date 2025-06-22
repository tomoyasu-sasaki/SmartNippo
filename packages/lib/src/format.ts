/**
 * 文字列フォーマット用ユーティリティ関数
 */

/**
 * 数値を3桁区切りでフォーマット
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

/**
 * ファイルサイズをフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 文字列を指定長で切り詰め
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * キャメルケースをケバブケースに変換
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * ケバブケースをキャメルケースに変換
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * 文字列の最初の文字を大文字に
 */
export function capitalize(str: string): string {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 文字列をタイトルケースに変換
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * URLスラッグを生成
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 特殊文字を除去
    .replace(/[\s_-]+/g, '-') // スペース、アンダースコア、ハイフンを単一のハイフンに
    .replace(/^-+|-+$/g, ''); // 先頭と末尾のハイフンを除去
}

/**
 * 電話番号をフォーマット
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

/**
 * 郵便番号をフォーマット
 */
export function formatPostalCode(postal: string): string {
  const cleaned = postal.replace(/\D/g, '');
  if (cleaned.length === 7) {
    return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
  }
  return postal;
}

/**
 * HTMLタグを除去
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 改行をHTMLの<br>タグに変換
 */
export function nl2br(text: string): string {
  return text.replace(/\n/g, '<br>');
}

/**
 * ランダムな文字列を生成
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * UUIDを生成（簡易版）
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 文字列をマスク
 */
export function maskString(str: string, visibleChars: number = 3, maskChar: string = '*'): string {
  if (str.length <= visibleChars) {
    return str;
  }
  const visible = str.substring(0, visibleChars);
  const masked = maskChar.repeat(str.length - visibleChars);
  return visible + masked;
}

/**
 * メールアドレスをマスク
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart ?? !domain) {
    return email;
  }

  const maskedLocal =
    localPart.length > 2
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : localPart;

  return `${maskedLocal}@${domain}`;
}

/**
 * テキストハイライト用のHTML生成
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
