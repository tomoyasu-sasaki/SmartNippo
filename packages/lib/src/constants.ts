/**
 * SmartNippo アプリケーション定数
 */

// User roles
export const USER_ROLES = {
  VIEWER: 'viewer',
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Report statuses
export const REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

// Comment types
export const COMMENT_TYPE = {
  USER: 'user',
  SYSTEM: 'system',
  AI: 'ai',
} as const;

export type CommentType = (typeof COMMENT_TYPE)[keyof typeof COMMENT_TYPE];

// API endpoints
export const API_ENDPOINTS = {
  REPORTS: '/api/reports',
  USERS: '/api/users',
  ORGANIZATIONS: '/api/organizations',
  COMMENTS: '/api/comments',
  AUTH: '/api/auth',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartnippo_auth_token',
  USER_PREFERENCES: 'smartnippo_user_preferences',
  DRAFT_REPORTS: 'smartnippo_draft_reports',
  THEME: 'smartnippo_theme',
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  DISPLAY_DATE: 'yyyy年MM月dd日',
  DISPLAY_DATETIME: 'yyyy年MM月dd日 HH:mm',
  TIME_ONLY: 'HH:mm',
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  REPORT_TITLE_MAX: 100,
  REPORT_CONTENT_MAX: 5000,
  COMMENT_MAX: 1000,
  USER_NAME_MAX: 50,
  ORG_NAME_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Theme colors (Tailwind CSS compatible)
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    600: '#475569',
    900: '#0f172a',
  },
  SUCCESS: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  WARNING: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  ERROR: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: 'SmartNippo',
  VERSION: '1.0.0',
  DESCRIPTION: 'Expo × Convex Daily-Report App',
  AUTHOR: 'SmartNippo Team',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  AI_SUMMARY: true,
  AI_CHAT: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: true,
  ANALYTICS: true,
  DARK_MODE: true,
} as const;
