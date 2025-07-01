/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as approvalFlows_mutations from "../approvalFlows/mutations.js";
import type * as approvalFlows_queries from "../approvalFlows/queries.js";
import type * as auth_auth from "../auth/auth.js";
import type * as backup_actions from "../backup/actions.js";
import type * as backup_config from "../backup/config.js";
import type * as backup_helpers from "../backup/helpers.js";
import type * as backup_queries from "../backup/queries.js";
import type * as http from "../http.js";
import type * as index from "../index.js";
import type * as migrations_migrations from "../migrations/migrations.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as reports_actions from "../reports/actions.js";
import type * as reports_comments from "../reports/comments.js";
import type * as reports_dashboard from "../reports/dashboard.js";
import type * as reports_mutations from "../reports/mutations.js";
import type * as reports_queries from "../reports/queries.js";
import type * as schema_approvalFlows from "../schema/approvalFlows.js";
import type * as schema_approvals from "../schema/approvals.js";
import type * as schema_audit_logs from "../schema/audit_logs.js";
import type * as schema_comments from "../schema/comments.js";
import type * as schema_orgs from "../schema/orgs.js";
import type * as schema_projects from "../schema/projects.js";
import type * as schema_reports from "../schema/reports.js";
import type * as schema_schema_versions from "../schema/schema_versions.js";
import type * as schema_userProfiles from "../schema/userProfiles.js";
import type * as schema_workCategories from "../schema/workCategories.js";
import type * as schema_workItems from "../schema/workItems.js";
import type * as schema_versioning_schema_versioning from "../schema_versioning/schema_versioning.js";
import type * as tests_test from "../tests/test.js";
import type * as uploads_uploads from "../uploads/uploads.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as validation_common from "../validation/common.js";
import type * as validation_organization from "../validation/organization.js";
import type * as validation_report from "../validation/report.js";
import type * as validation_user from "../validation/user.js";
import type * as workCategories_mutations from "../workCategories/mutations.js";
import type * as workCategories_queries from "../workCategories/queries.js";
import type * as workItems_mutations from "../workItems/mutations.js";
import type * as workItems_queries from "../workItems/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "approvalFlows/mutations": typeof approvalFlows_mutations;
  "approvalFlows/queries": typeof approvalFlows_queries;
  "auth/auth": typeof auth_auth;
  "backup/actions": typeof backup_actions;
  "backup/config": typeof backup_config;
  "backup/helpers": typeof backup_helpers;
  "backup/queries": typeof backup_queries;
  http: typeof http;
  index: typeof index;
  "migrations/migrations": typeof migrations_migrations;
  "organizations/mutations": typeof organizations_mutations;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  "reports/actions": typeof reports_actions;
  "reports/comments": typeof reports_comments;
  "reports/dashboard": typeof reports_dashboard;
  "reports/mutations": typeof reports_mutations;
  "reports/queries": typeof reports_queries;
  "schema/approvalFlows": typeof schema_approvalFlows;
  "schema/approvals": typeof schema_approvals;
  "schema/audit_logs": typeof schema_audit_logs;
  "schema/comments": typeof schema_comments;
  "schema/orgs": typeof schema_orgs;
  "schema/projects": typeof schema_projects;
  "schema/reports": typeof schema_reports;
  "schema/schema_versions": typeof schema_schema_versions;
  "schema/userProfiles": typeof schema_userProfiles;
  "schema/workCategories": typeof schema_workCategories;
  "schema/workItems": typeof schema_workItems;
  "schema_versioning/schema_versioning": typeof schema_versioning_schema_versioning;
  "tests/test": typeof tests_test;
  "uploads/uploads": typeof uploads_uploads;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "validation/common": typeof validation_common;
  "validation/organization": typeof validation_organization;
  "validation/report": typeof validation_report;
  "validation/user": typeof validation_user;
  "workCategories/mutations": typeof workCategories_mutations;
  "workCategories/queries": typeof workCategories_queries;
  "workItems/mutations": typeof workItems_mutations;
  "workItems/queries": typeof workItems_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
