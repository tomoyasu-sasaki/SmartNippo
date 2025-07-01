/**
 * @fileoverview データベーススキーマ定義
 *
 * @description アプリケーション全体のデータベーススキーマを定義します。
 * 各テーブルのスキーマは`convex/schema/`ディレクトリに分割されており、
 * このファイルで集約してエクスポートします。
 *
 * @since 1.1.0
 */
import { defineSchema } from 'convex/server';

import { approvalFlowsTable } from './schema/approvalFlows';
import { approvalsTable } from './schema/approvals';
import { auditLogsTable } from './schema/audit_logs';
import { commentsTable } from './schema/comments';
import { orgsTable } from './schema/orgs';
import { projectsTable } from './schema/projects';
import { reportsTable } from './schema/reports';
import { schemaVersionsTable } from './schema/schema_versions';
import { userProfilesTable } from './schema/userProfiles';
import { workCategoriesTable } from './schema/workCategories';
import { workItemsTable } from './schema/workItems';

/**
 * SmartNippo データベーススキーマ
 *
 * @description 全てのテーブル定義とインデックス設定を含むスキーマオブジェクト。
 * 各テーブルは `convex/schema/` ディレクトリに分割され、ここで集約されます。
 *
 * @exports defineSchema
 */
export default defineSchema({
  orgs: orgsTable,
  userProfiles: userProfilesTable,
  reports: reportsTable,
  projects: projectsTable,
  workCategories: workCategoriesTable,
  comments: commentsTable,
  approvals: approvalsTable,
  approvalFlows: approvalFlowsTable,
  audit_logs: auditLogsTable,
  schema_versions: schemaVersionsTable,
  workItems: workItemsTable,
});
