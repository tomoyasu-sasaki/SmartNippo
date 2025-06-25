/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';
import type * as backup_procedures from '../backup_procedures.js';
import type * as http from '../http.js';
import type * as lib_auth from '../lib/auth.js';
import type * as migrations from '../migrations.js';
import type * as reports from '../reports.js';
import type * as schema_versioning from '../schema_versioning.js';
import type * as test from '../test.js';
import type * as uploads from '../uploads.js';
import type * as users from '../users.js';
import type * as validation from '../validation.js';

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  backup_procedures: typeof backup_procedures;
  http: typeof http;
  'lib/auth': typeof lib_auth;
  migrations: typeof migrations;
  reports: typeof reports;
  schema_versioning: typeof schema_versioning;
  test: typeof test;
  uploads: typeof uploads;
  users: typeof users;
  validation: typeof validation;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>;
