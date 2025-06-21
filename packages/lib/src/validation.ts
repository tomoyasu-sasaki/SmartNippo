import { z } from 'zod';

/**
 * 共通バリデーションスキーマ
 */

// Email validation
export const emailSchema = z.string().email('有効なメールアドレスを入力してください');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'パスワードは8文字以上である必要があります')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります');

// User role validation
export const userRoleSchema = z.enum(['viewer', 'user', 'manager', 'admin']);

// Report status validation
export const reportStatusSchema = z.enum(['draft', 'submitted', 'approved']);

// Date string validation (YYYY-MM-DD format)
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります');

// UUID validation
export const uuidSchema = z.string().uuid('有効なUUIDである必要があります');

// Organization schema
export const organizationSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, '組織名は必須です'),
  domain: z.string().optional(),
});

// User schema
export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: z.string().min(1, '名前は必須です'),
  orgId: uuidSchema,
  role: userRoleSchema,
  avatarUrl: z.string().url().optional(),
  pushToken: z.string().optional(),
});

// Report schema
export const reportSchema = z.object({
  id: uuidSchema,
  authorId: uuidSchema,
  reportDate: dateStringSchema,
  title: z.string().min(1, 'タイトルは必須です'),
  content: z.string().min(1, '内容は必須です'),
  status: reportStatusSchema,
  summary: z.string().optional(),
  tasks: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  isDeleted: z.boolean().default(false),
  orgId: uuidSchema,
});

// Comment schema
export const commentSchema = z.object({
  id: uuidSchema,
  reportId: uuidSchema,
  authorId: uuidSchema.optional(),
  content: z.string().min(1, 'コメント内容は必須です'),
  type: z.enum(['user', 'system', 'ai']).default('user'),
});

/**
 * バリデーション用ユーティリティ関数
 */

export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function isValidUUID(id: string): boolean {
  try {
    uuidSchema.parse(id);
    return true;
  } catch {
    return false;
  }
}

// isValidDateString function is available in date.ts

/**
 * Safe parsing with error handling
 */
export function safeParseWithError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
