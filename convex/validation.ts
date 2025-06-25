import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// バリデーションエラー型定義
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// バリデーション結果型
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 共通バリデーション関数
const validateEmail = (email: string): ValidationError[] => {
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

const validateName = (name: string, fieldName: string): ValidationError[] => {
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

const validateUrl = (url: string, fieldName: string, required = false): ValidationError[] => {
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

// Organization バリデーション
export const validateOrganization = mutation({
  args: {
    name: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];

    // Name validation
    errors.push(...validateName(args.name, 'name'));

    // Plan validation
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(args.plan)) {
      errors.push({
        field: 'plan',
        message: 'Invalid plan type',
        code: 'INVALID_VALUE',
        value: args.plan,
      });
    }

    // Check for duplicate organization names
    if (args.name) {
      const existingOrg = await ctx.db
        .query('orgs')
        .filter((q) => q.eq(q.field('name'), args.name))
        .first();

      if (existingOrg) {
        errors.push({
          field: 'name',
          message: 'Organization name already exists',
          code: 'DUPLICATE',
          value: args.name,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

// User Profile バリデーション
export const validateUserProfile = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal('viewer'), v.literal('user'), v.literal('manager'), v.literal('admin')),
    orgId: v.optional(v.id('orgs')),
    avatarUrl: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        github: v.optional(v.string()),
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];

    // Email validation (if provided)
    if (args.email) {
      errors.push(...validateEmail(args.email));

      // Check for duplicate email
      const existingUser = await ctx.db
        .query('userProfiles')
        .filter((q) => q.eq(q.field('email'), args.email))
        .first();

      if (existingUser) {
        errors.push({
          field: 'email',
          message: 'Email already registered',
          code: 'DUPLICATE',
          value: args.email,
        });
      }
    }

    // Name validation
    errors.push(...validateName(args.name, 'name'));

    // Role validation
    const validRoles = ['viewer', 'user', 'manager', 'admin'];
    if (!validRoles.includes(args.role)) {
      errors.push({
        field: 'role',
        message: 'Invalid role',
        code: 'INVALID_VALUE',
        value: args.role,
      });
    }

    // Organization validation
    if (args.orgId) {
      const org = await ctx.db.get(args.orgId);
      if (!org) {
        errors.push({
          field: 'orgId',
          message: 'Organization not found',
          code: 'NOT_FOUND',
          value: args.orgId,
        });
      }
    }

    // Avatar URL validation
    if (args.avatarUrl) {
      errors.push(...validateUrl(args.avatarUrl, 'avatarUrl'));
    }

    // Social links validation
    if (args.socialLinks) {
      Object.entries(args.socialLinks).forEach(([platform, url]) => {
        if (url) {
          errors.push(...validateUrl(url, `socialLinks.${platform}`));
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

// Report バリデーション
export const validateReport = mutation({
  args: {
    authorId: v.id('userProfiles'),
    reportDate: v.string(),
    title: v.string(),
    content: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('submitted'),
      v.literal('approved'),
      v.literal('rejected')
    ),
    orgId: v.id('orgs'),
    tasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
          priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
          estimatedHours: v.optional(v.number()),
          actualHours: v.optional(v.number()),
          category: v.optional(v.string()),
        })
      )
    ),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
          size: v.number(),
          type: v.string(),
          uploadedAt: v.number(),
          description: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];

    // Author validation
    const author = await ctx.db.get(args.authorId);
    if (!author) {
      errors.push({
        field: 'authorId',
        message: 'Author not found',
        code: 'NOT_FOUND',
        value: args.authorId,
      });
    } else if (author.orgId !== args.orgId) {
      errors.push({
        field: 'authorId',
        message: 'Author does not belong to the specified organization',
        code: 'UNAUTHORIZED',
        value: args.authorId,
      });
    }

    // Organization validation
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      errors.push({
        field: 'orgId',
        message: 'Organization not found',
        code: 'NOT_FOUND',
        value: args.orgId,
      });
    }

    // Report date validation
    if (!args.reportDate) {
      errors.push({ field: 'reportDate', message: 'Report date is required', code: 'REQUIRED' });
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(args.reportDate)) {
        errors.push({
          field: 'reportDate',
          message: 'Invalid date format (expected YYYY-MM-DD)',
          code: 'INVALID_FORMAT',
          value: args.reportDate,
        });
      } else {
        const date = new Date(args.reportDate);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (date < oneYearAgo) {
          errors.push({
            field: 'reportDate',
            message: 'Report date cannot be more than 1 year ago',
            code: 'OUT_OF_RANGE',
            value: args.reportDate,
          });
        } else if (date > oneWeekFromNow) {
          errors.push({
            field: 'reportDate',
            message: 'Report date cannot be more than 1 week in the future',
            code: 'OUT_OF_RANGE',
            value: args.reportDate,
          });
        }
      }
    }

    // Title validation
    if (!args.title || args.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required', code: 'REQUIRED' });
    } else if (args.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title too long (max 200 characters)',
        code: 'TOO_LONG',
        value: args.title,
      });
    }

    // Content validation
    if (!args.content || args.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Content is required', code: 'REQUIRED' });
    } else if (args.content.length > 10000) {
      errors.push({
        field: 'content',
        message: 'Content too long (max 10000 characters)',
        code: 'TOO_LONG',
        value: args.content.length,
      });
    }

    // Status validation
    const validStatuses = ['draft', 'submitted', 'approved', 'rejected'];
    if (!validStatuses.includes(args.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid status',
        code: 'INVALID_VALUE',
        value: args.status,
      });
    }

    // Tasks validation
    if (args.tasks) {
      if (args.tasks.length > 50) {
        errors.push({
          field: 'tasks',
          message: 'Too many tasks (max 50)',
          code: 'TOO_MANY',
          value: args.tasks.length,
        });
      }

      args.tasks.forEach((task, index) => {
        if (!task.title || task.title.trim().length === 0) {
          errors.push({
            field: `tasks[${index}].title`,
            message: 'Task title is required',
            code: 'REQUIRED',
          });
        } else if (task.title.length > 100) {
          errors.push({
            field: `tasks[${index}].title`,
            message: 'Task title too long (max 100 characters)',
            code: 'TOO_LONG',
            value: task.title,
          });
        }

        if (task.estimatedHours && (task.estimatedHours < 0 || task.estimatedHours > 24)) {
          errors.push({
            field: `tasks[${index}].estimatedHours`,
            message: 'Estimated hours must be between 0 and 24',
            code: 'OUT_OF_RANGE',
            value: task.estimatedHours,
          });
        }

        if (task.actualHours && (task.actualHours < 0 || task.actualHours > 24)) {
          errors.push({
            field: `tasks[${index}].actualHours`,
            message: 'Actual hours must be between 0 and 24',
            code: 'OUT_OF_RANGE',
            value: task.actualHours,
          });
        }
      });
    }

    // Attachments validation
    if (args.attachments) {
      if (args.attachments.length > 20) {
        errors.push({
          field: 'attachments',
          message: 'Too many attachments (max 20)',
          code: 'TOO_MANY',
          value: args.attachments.length,
        });
      }

      args.attachments.forEach((attachment, index) => {
        if (!attachment.name || attachment.name.trim().length === 0) {
          errors.push({
            field: `attachments[${index}].name`,
            message: 'Attachment name is required',
            code: 'REQUIRED',
          });
        }

        if (attachment.size > 50 * 1024 * 1024) {
          // 50MB
          errors.push({
            field: `attachments[${index}].size`,
            message: 'File too large (max 50MB)',
            code: 'TOO_LARGE',
            value: attachment.size,
          });
        }

        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/json',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!allowedTypes.includes(attachment.type)) {
          errors.push({
            field: `attachments[${index}].type`,
            message: 'File type not allowed',
            code: 'INVALID_TYPE',
            value: attachment.type,
          });
        }
      });
    }

    // Check for duplicate report on same date by same author
    if (author && args.reportDate) {
      const existingReport = await ctx.db
        .query('reports')
        .withIndex('by_author_date', (q) =>
          q.eq('authorId', args.authorId).eq('reportDate', args.reportDate)
        )
        .first();

      if (existingReport) {
        errors.push({
          field: 'reportDate',
          message: 'Report already exists for this date',
          code: 'DUPLICATE',
          value: args.reportDate,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

// バリデーション統計取得
export const getValidationStats = query({
  args: {},
  handler: async (ctx) => {
    // 最近のvalidationエラーを audit_logs から取得
    const recentErrors = await ctx.db
      .query('audit_logs')
      .filter((q) => q.eq(q.field('action'), 'validation_error'))
      .order('desc')
      .take(100);

    const errorsByType = recentErrors.reduce(
      (acc, log) => {
        const errorCode = log.payload?.errorCode ?? 'UNKNOWN';
        acc[errorCode] = (acc[errorCode] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsByField = recentErrors.reduce(
      (acc, log) => {
        const field = log.payload?.field ?? 'UNKNOWN';
        acc[field] = (acc[field] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByField,
      timestamp: Date.now(),
    };
  },
});

// バリデーションエラーログ記録
export const logValidationError = mutation({
  args: {
    tableName: v.string(),
    errors: v.array(
      v.object({
        field: v.string(),
        message: v.string(),
        code: v.string(),
        value: v.optional(v.any()),
      })
    ),
    userId: v.optional(v.id('userProfiles')),
    orgId: v.optional(v.id('orgs')),
  },
  handler: async (ctx, args) => {
    // 各エラーを個別にログ記録
    for (const error of args.errors) {
      await ctx.db.insert('audit_logs', {
        actor_id: args.userId ?? ('system' as any),
        action: 'validation_error',
        payload: {
          tableName: args.tableName,
          field: error.field,
          message: error.message,
          errorCode: error.code,
          value: error.value,
          timestamp: Date.now(),
        },
        created_at: Date.now(),
        org_id: args.orgId ?? ('system' as any),
      });
    }

    return { success: true, errorsLogged: args.errors.length };
  },
});
