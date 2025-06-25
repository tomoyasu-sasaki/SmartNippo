// Type definitions for SmartNippo
// Export shared types and Convex schema types here

export const version = '0.1.0';

// Re-export Convex types (conditional export based on availability)

// Convex document base type
export type ConvexDocument<T = Record<string, unknown>> = T & {
  _id: string;
  _creationTime: number;
};

// User roles enum
export type UserRole = 'viewer' | 'user' | 'manager' | 'admin';

// Report status enum
export type ReportStatus = 'draft' | 'submitted' | 'approved';

// Comment type enum
export type CommentType = 'user' | 'system' | 'ai';

// Core entity interfaces
export interface Organization {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  avatarUrl?: string;
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  authorId: string;
  reportDate: string;
  title: string;
  content: string;
  status: ReportStatus;
  summary?: string;
  tasks: string[];
  attachments: string[];
  metadata: Record<string, unknown>;
  isDeleted: boolean;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  reportId: string;
  authorId?: string;
  content: string;
  type: CommentType;
  createdAt: string;
}

export interface Approval {
  id: string;
  reportId: string;
  managerId: string;
  approvedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
  orgId: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  name: string;
  orgName: string;
}

export interface ReportForm {
  title: string;
  content: string;
  reportDate: string;
  tasks: string[];
}

export interface CommentForm {
  content: string;
}

export interface ProfileForm {
  name: string;
  email: string;
  avatarUrl?: string;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FilterState {
  status?: ReportStatus;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Theme types
export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
}

// File upload types
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

// Search types
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights: string[];
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types for real-time updates
export interface RealtimeEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  convexUrl: string;
  features: {
    aiSummary: boolean;
    aiChat: boolean;
    pushNotifications: boolean;
    offlineMode: boolean;
    analytics: boolean;
    darkMode: boolean;
  };
}
