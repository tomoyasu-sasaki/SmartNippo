// ========================================
// Analytics and tracking types
// ========================================

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export interface PageViewEvent {
  url: string;
  title: string;
  referrer?: string;
  timestamp: number;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  plan?: string;
  role?: string;
  organizationId?: string;
}
