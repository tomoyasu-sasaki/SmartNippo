// ========================================
// Core entity interfaces (Updated to match current schema)
// ========================================

export interface Organization {
  _id: string;
  clerkId: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: number;
  updated_at: number;
}

export interface UserProfile {
  _id: string;
  clerkId: string;
  email?: string;
  tokenIdentifier?: string;
  name: string;
  role: UserRole;
  orgId?: string;
  avatarUrl?: string;
  avatarStorageId?: string;
  pushToken?: string;
  socialLinks?: SocialLinks;
  privacySettings?: PrivacySettings;
  created_at: number;
  updated_at: number;
}

export interface Report {
  _id: string;
  authorId: string;
  projectId?: string;
  reportDate: string;
  workingHours?: WorkingHours;
  title: string;
  content: string;
  status: ReportStatus;
  summary?: string;
  aiSummaryStatus?: AISummaryStatus;
  attachments: Attachment[];
  metadata: ReportMetadata;
  submittedAt?: number;
  approvedAt?: number;
  rejectedAt?: number;
  rejectionReason?: string;
  editHistory?: EditHistoryItem[];
  isDeleted: boolean;
  deletedAt?: number;
  deletedBy?: string;
  orgId: string;
  created_at: number;
  updated_at: number;
}

export interface Comment {
  _id: string;
  reportId: string;
  authorId?: string;
  content: string;
  type: CommentType;
  created_at: number;
}

export interface Approval {
  _id: string;
  reportId: string;
  managerId: string;
  approved_at: number;
}

export interface AuditLog {
  _id: string;
  actor_id?: string;
  action: string;
  payload: unknown;
  created_at: number;
  org_id?: string;
}

export interface Project {
  _id: string;
  orgId: string;
  name: string;
  description?: string;
  created_at: number;
  updated_at: number;
}

export interface WorkCategory {
  _id: string;
  projectId: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface WorkItem {
  _id: string;
  reportId: string;
  workDuration: number;
  projectId: string;
  workCategoryId: string;
  description: string;
  created_at: number;
  updated_at: number;
}

// ========================================
// Supporting types for entities
// ========================================

export interface WorkingHours {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface Attachment {
  id: string;
  name: string;
  url?: string;
  storageId?: string;
  size: number;
  type: string;
  uploadedAt: number;
  description?: string;
}

export interface ReportMetadata {
  mood?: 'positive' | 'neutral' | 'negative' | null;
  location?: string;
  tags?: string[];
  version?: number;
  previousReportId?: string;
  template?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  achievements?: string[];
  challenges?: string[];
  learnings?: string[];
  nextActionItems?: string[];
}

export interface EditHistoryItem {
  editedAt: number;
  editorId: string;
  changes: string;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

export interface PrivacySettings {
  profile?: PrivacyLevel;
  email?: PrivacyLevel;
  socialLinks?: PrivacyLevel;
  reports?: PrivacyLevel;
  avatar?: PrivacyLevel;
}

// ========================================
// Statistics and aggregate types
// ========================================

// レポート統計情報の型定義
export interface ReportStats {
  workItemCount: number;
  totalWorkDuration: number; // in minutes
  commentCount: number;
}

// Import required types
import type { AISummaryStatus, CommentType, PrivacyLevel, ReportStatus, UserRole } from './enums';
