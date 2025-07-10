// ========================================
// Form field types
// ========================================

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface FormSubmitResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

// フォームフィールドのエラー
export interface FormFieldError {
  message: string;
}

// フォームの状態
export interface FormStateUI {
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, FormFieldError>;
}

// ========================================
// Form data types
// ========================================

import type { WorkingHours, WorkItem } from '../core/entities';

// レポート作成フォームデータの型定義
export interface ReportFormData {
  reportDate: string;
  projectId?: string;
  title: string;
  content: string;
  workingHours: WorkingHours;
  workItems: Array<
    Partial<WorkItem> & {
      isNew?: boolean;
      projectId: string | null;
      workCategoryId: string | null;
      description: string;
      workDuration: number;
    }
  >;
  metadata: {
    mood?: 'positive' | 'neutral' | 'negative';
    location?: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    achievements?: string[];
    challenges?: string[];
    learnings?: string[];
    nextActionItems?: string[];
  };
}

// プロフィールフォームデータの型定義は@smartnippo/libに移動しました
// import type { ProfileFormData, ProfileUpdateData } from '@smartnippo/lib';
