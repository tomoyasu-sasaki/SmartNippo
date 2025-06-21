import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS classes を効率的にマージするユーティリティ関数
 * shadcn/ui で標準的に使用される cn 関数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
