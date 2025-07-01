// ========================================
// Convex type aliases
// ========================================

// Note: これらの型エイリアスは、実際のConvex生成型をインポートして使用する際に
// 各アプリケーションで定義する必要があります。
// ここでは参考として型定義のみを提供します。

// Doc型エイリアスの例
export type ReportDoc = unknown; // 実際には Doc<'reports'> を使用
export type UserProfileDoc = unknown; // 実際には Doc<'userProfiles'> を使用
export type CommentDoc = unknown; // 実際には Doc<'comments'> を使用
export type ApprovalDoc = unknown; // 実際には Doc<'approvals'> を使用
export type OrganizationDoc = unknown; // 実際には Doc<'orgs'> を使用
export type WorkItemDoc = unknown; // 実際には Doc<'workItems'> を使用
export type ProjectDoc = unknown; // 実際には Doc<'projects'> を使用
export type WorkCategoryDoc = unknown; // 実際には Doc<'workCategories'> を使用

// ID型エイリアスの例
export type ReportId = string; // 実際には Id<'reports'> を使用
export type UserId = string; // 実際には Id<'userProfiles'> を使用
export type CommentId = string; // 実際には Id<'comments'> を使用
export type OrgId = string; // 実際には Id<'orgs'> を使用
export type WorkItemId = string; // 実際には Id<'workItems'> を使用
export type ProjectId = string; // 実際には Id<'projects'> を使用
export type WorkCategoryId = string; // 実際には Id<'workCategories'> を使用

// Convex user document type for web
export interface ConvexUserDoc {
  _id: string;
  _creationTime: number;
  clerkId: string;
  email?: string;
  name?: string;
  role: 'user' | 'manager' | 'admin';
  avatar?: string;
  socialLinks?: Record<string, string>;
  privacySettings?: Record<string, 'public' | 'organization' | 'team' | 'private'>;
  lastActiveAt?: number;
  status?: 'active' | 'inactive';
}
