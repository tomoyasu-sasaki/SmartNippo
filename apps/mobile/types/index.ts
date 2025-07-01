// Export all types from shared packages
export * from '@smartnippo/types';

// Convex生成型のインポート
import type { api } from 'convex/_generated/api';
import type { Doc, Id, TableNames } from 'convex/_generated/dataModel';

// Convex型の再エクスポート
export { api };
export type { Doc, Id, TableNames };

// Convex Doc型を使用した型エイリアス（Mobile固有）
export type Report = Doc<'reports'>;
export type UserProfile = Doc<'userProfiles'>;
export type Comment = Doc<'comments'>;
export type Approval = Doc<'approvals'>;
export type Organization = Doc<'orgs'>;
export type WorkItem = Doc<'workItems'>;
export type Project = Doc<'projects'>;
export type WorkCategory = Doc<'workCategories'>;
// ID型エイリアス
export type ReportId = Id<'reports'>;
export type UserId = Id<'userProfiles'>;
export type CommentId = Id<'comments'>;
export type OrgId = Id<'orgs'>;
export type WorkItemId = Id<'workItems'>;
export type ProjectId = Id<'projects'>;
export type WorkCategoryId = Id<'workCategories'>;
