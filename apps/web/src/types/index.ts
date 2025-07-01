/**
 * 型定義のメインエクスポートファイル
 *
 * Webアプリケーション全体で使用する型定義を集約
 */

// Export all types from shared packages
export * from '@smartnippo/types';

// Re-export Convex-generated types for convenience
export type { Doc, Id } from 'convex/_generated/dataModel';

// Import Convex Id type for local usage
import type { Id } from 'convex/_generated/dataModel';

// Alias for report Id type (Convex specific)
export type ReportId = Id<'reports'>;
