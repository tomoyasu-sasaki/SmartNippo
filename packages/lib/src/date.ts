import { addDays, endOfDay, format, isValid, parseISO, startOfDay, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付フォーマット関数
 */

export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    throw new Error('Invalid date');
  }
  return format(dateObj, formatStr, { locale: ja });
}

export function formatDisplayDate(date: Date | string): string {
  return formatDate(date, 'yyyy年MM月dd日');
}

export function formatDisplayDateTime(date: Date | string): string {
  return formatDate(date, 'yyyy年MM月dd日 HH:mm');
}

export function formatTimeOnly(date: Date | string): string {
  return formatDate(date, 'HH:mm');
}

/**
 * 日付計算関数
 */

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getYesterdayISO(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

export function getTomorrowISO(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * 日付バリデーション関数
 */

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date);
}

export function isValidDateString(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
}

export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const yesterday = subDays(new Date(), 1);
  return format(dateObj, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
}

export function isTomorrow(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const tomorrow = addDays(new Date(), 1);
  return format(dateObj, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
}

/**
 * 相対日付表示
 */

export function getRelativeDateLabel(date: Date | string): string {
  if (isToday(date)) {
    return '今日';
  }
  if (isYesterday(date)) {
    return '昨日';
  }
  if (isTomorrow(date)) {
    return '明日';
  }
  return formatDisplayDate(date);
}

/**
 * 日付範囲生成
 */

export function generateDateRange(startDate: Date | string, endDate: Date | string): string[] {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  const dates: string[] = [];
  let currentDate = start;

  while (currentDate <= end) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * 週の開始日・終了日取得
 */

export function getWeekStart(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const day = dateObj.getDay();
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
  return new Date(dateObj.setDate(diff));
}

export function getWeekEnd(date: Date | string = new Date()): Date {
  const weekStart = getWeekStart(date);
  return addDays(weekStart, 6);
}

/**
 * 月の開始日・終了日取得
 */

export function getMonthStart(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
}

export function getMonthEnd(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
}

/**
 * 法定労働時間に基づいた休憩時間を計算する
 * @param workDurationInMinutes - 勤務時間（分）
 * @returns 休憩時間（分）
 */
export function calculateBreakTimeInMinutes(workDurationInMinutes: number): number {
  const EIGHT_HOURS_IN_MINUTES = 8 * 60;
  const SIX_HOURS_IN_MINUTES = 6 * 60;

  if (workDurationInMinutes > EIGHT_HOURS_IN_MINUTES) {
    return 60; // 8時間超は60分
  }
  if (workDurationInMinutes > SIX_HOURS_IN_MINUTES) {
    return 45; // 6時間超8時間以下は45分
  }
  return 0; // 6時間以下は0分
}
