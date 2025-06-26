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
import type * as auth_auth from "../auth/auth.js";
import type * as backup_actions from "../backup/actions.js";
import type * as backup_config from "../backup/config.js";
import type * as backup_helpers from "../backup/helpers.js";
import type * as backup_queries from "../backup/queries.js";
import type * as http_http from "../http/http.js";
import type * as index from "../index.js";
import type * as migrations_migrations from "../migrations/migrations.js";
import type * as reports_comments from "../reports/comments.js";
import type * as reports_dashboard from "../reports/dashboard.js";
import type * as reports_mutations from "../reports/mutations.js";
import type * as reports_queries from "../reports/queries.js";
import type * as schema_versioning_schema_versioning from "../schema_versioning/schema_versioning.js";
import type * as tests_test from "../tests/test.js";
import type * as uploads_uploads from "../uploads/uploads.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as validation_common from "../validation/common.js";
import type * as validation_organization from "../validation/organization.js";
import type * as validation_report from "../validation/report.js";
import type * as validation_user from "../validation/user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/auth": typeof auth_auth;
  "backup/actions": typeof backup_actions;
  "backup/config": typeof backup_config;
  "backup/helpers": typeof backup_helpers;
  "backup/queries": typeof backup_queries;
  "http/http": typeof http_http;
  index: typeof index;
  "migrations/migrations": typeof migrations_migrations;
  "reports/comments": typeof reports_comments;
  "reports/dashboard": typeof reports_dashboard;
  "reports/mutations": typeof reports_mutations;
  "reports/queries": typeof reports_queries;
  "schema_versioning/schema_versioning": typeof schema_versioning_schema_versioning;
  "tests/test": typeof tests_test;
  "uploads/uploads": typeof uploads_uploads;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "validation/common": typeof validation_common;
  "validation/organization": typeof validation_organization;
  "validation/report": typeof validation_report;
  "validation/user": typeof validation_user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
