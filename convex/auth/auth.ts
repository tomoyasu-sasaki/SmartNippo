/**
 * @fileoverview 認証・認可ヘルパー関数
 *
 * @description ユーザー認証、権限チェック、組織メンバーシップ管理、監査ログ記録など、
 * セキュリティに関わる共通機能を提供します。ロールベースアクセス制御（RBAC）を実装し、
 * データ分離とアクセス制御を一元管理します。
 *
 * @since 1.0.0
 */

import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

/**
 * 認証済みユーザー情報の取得
 *
 * @description 現在の認証コンテキストから認証済みユーザーの情報を取得します。
 * 認証トークンを基にユーザープロファイルを特定し、未認証の場合は null を返します。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @returns {Promise<Doc<'userProfiles'> | null>} 認証済みユーザー情報または null
 * @example
 * ```typescript
 * const user = await getAuthenticatedUser(ctx);
 * if (user) {
 *   console.log('Authenticated user:', user.name);
 * } else {
 *   console.log('User not authenticated');
 * }
 * ```
 * @since 1.0.0
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<'userProfiles'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // 1. tokenIdentifier で検索 (通常ログインフロー)
  const user = await ctx.db
    .query('userProfiles')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique();

  // userProfiles レコードが存在しない場合は null を返す
  return user;
}

/**
 * 認証必須チェック
 *
 * @description 認証が必要な操作で使用し、未認証の場合は例外をスローします。
 * 確実に認証済みユーザーを取得したい場合に使用してください。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 認証されていない場合
 * @example
 * ```typescript
 * const user = await requireAuthentication(ctx);
 * // この時点で user は必ず認証済みユーザー
 * console.log('Authorized user:', user.name);
 * ```
 * @since 1.0.0
 */
export async function requireAuthentication(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<'userProfiles'>> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error('認証が必要です');
  }
  return user;
}

/**
 * 組織メンバーシップ検証
 *
 * @description 指定された組織のメンバーであることを確認します。
 * 組織レベルのデータアクセス制御に使用し、他組織のデータへの不正アクセスを防止します。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @param {Id<'orgs'>} orgId - 対象組織のID
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 認証されていない場合または組織メンバーでない場合
 * @example
 * ```typescript
 * const user = await requireOrgMembership(ctx, organizationId);
 * // この時点で user は指定組織のメンバー
 * console.log(`${user.name} is member of org ${user.orgId}`);
 * ```
 * @since 1.0.0
 */
export async function requireOrgMembership(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  const user = await requireAuthentication(ctx);

  if (!user.orgId || user.orgId !== orgId) {
    throw new Error('組織へのアクセス権限がありません');
  }

  return user;
}

/**
 * ユーザーロール定義
 *
 * @description システムで利用可能なユーザーロールの型定義です。
 * 権限レベルは user < manager < admin の順で上位になります。
 *
 * @typedef {'user' | 'manager' | 'admin'} UserRole
 * @since 1.0.0
 */
export type UserRole = 'user' | 'manager' | 'admin';

/**
 * ロール権限レベル判定
 *
 * @description ユーザーが指定されたロール以上の権限を持っているかを判定します。
 * ロールヒエラルキーに基づいた権限比較を行い、上位ロールは下位ロールの権限を含みます。
 *
 * @function
 * @param {Doc<'userProfiles'>} user - 対象ユーザー
 * @param {UserRole} requiredRole - 必要な最小ロール
 * @returns {boolean} 必要なロール以上の権限を持っているかどうか
 * @example
 * ```typescript
 * if (hasRole(user, 'manager')) {
 *   console.log('User has manager or admin privileges');
 * }
 * ```
 * @since 1.0.0
 */
export function hasRole(user: Doc<'userProfiles'>, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  return roleHierarchy[user.role as UserRole] >= roleHierarchy[requiredRole];
}

/**
 * 最小権限レベル要求
 *
 * @description 指定されたロール以上の権限を持つ認証済みユーザーを取得します。
 * 権限不足の場合は例外をスローし、セキュアな操作を保証します。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @param {UserRole} requiredRole - 必要な最小ロール
 * @param {Id<'orgs'>} [orgId] - 組織ID（指定時は組織メンバーシップも確認）
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 認証されていない場合または権限不足の場合
 * @example
 * ```typescript
 * // 管理者権限が必要な操作
 * const adminUser = await requireRole(ctx, 'admin', orgId);
 * console.log('Admin operation authorized for:', adminUser.name);
 * ```
 * @since 1.0.0
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  requiredRole: UserRole,
  orgId?: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  const user = orgId ? await requireOrgMembership(ctx, orgId) : await requireAuthentication(ctx);

  if (!hasRole(user, requiredRole)) {
    throw new Error(`${requiredRole}以上の権限が必要です`);
  }

  return user;
}

/**
 * リソース所有権または管理者権限チェック
 *
 * @description リソースの所有者または管理者・マネージャー権限を持つユーザーのみアクセスを許可します。
 * 自分のデータは編集でき、管理者・マネージャーは他ユーザーのデータも操作可能な設計です。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @param {Id<'userProfiles'>} resourceAuthorId - リソース所有者のユーザーID
 * @param {Id<'orgs'>} orgId - 組織ID
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 権限不足の場合
 * @example
 * ```typescript
 * const user = await requireOwnershipOrManagerRole(ctx, report.authorId, report.orgId);
 * // レポートの作成者または管理者のみ編集可能
 * ```
 * @since 1.0.0
 */
export async function requireOwnershipOrManagerRole(
  ctx: QueryCtx | MutationCtx,
  resourceAuthorId: Id<'userProfiles'>,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  const user = await requireOrgMembership(ctx, orgId);

  // 自分のリソースの場合はOK
  if (user._id === resourceAuthorId) {
    return user;
  }

  // manager/admin権限があればOK
  if (hasRole(user, 'manager')) {
    return user;
  }

  throw new Error('リソースの所有者またはマネージャー権限が必要です');
}

/**
 * 読み取り専用アクセス権限チェック
 *
 * @description 最低限のアクセス権（user以上）を確認します。
 * データの閲覧のみ許可される操作で使用します。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @param {Id<'orgs'>} orgId - 組織ID
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 権限不足の場合
 * @example
 * ```typescript
 * const user = await requireReadAccess(ctx, orgId);
 * // データの閲覧が許可された
 * ```
 * @since 1.0.0
 */
export async function requireReadAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  return await requireRole(ctx, 'user', orgId);
}

/**
 * 書き込みアクセス権限チェック
 *
 * @description データの作成・更新権限（user以上）を確認します。
 * データの変更を伴う操作で使用します。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @param {Id<'orgs'>} orgId - 組織ID
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 権限不足の場合
 * @example
 * ```typescript
 * const user = await requireWriteAccess(ctx, orgId);
 * // データの作成・更新が許可された
 * ```
 * @since 1.0.0
 */
export async function requireWriteAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  return await requireRole(ctx, 'user', orgId);
}

/**
 * 管理者アクセス権限チェック
 *
 * @description 管理者権限（admin）を確認します。
 * システム設定変更や重要な操作で使用します。
 *
 * @async
 * @function
 * @param {QueryCtx | MutationCtx} ctx - Convex context オブジェクト
 * @param {Id<'orgs'>} orgId - 組織ID
 * @returns {Promise<Doc<'userProfiles'>>} 認証済みユーザー情報
 * @throws {Error} 権限不足の場合
 * @example
 * ```typescript
 * const adminUser = await requireAdminAccess(ctx, orgId);
 * // 管理者操作が許可された
 * ```
 * @since 1.0.0
 */
export async function requireAdminAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  return await requireRole(ctx, 'admin', orgId);
}

/**
 * 組織データフィルタリング
 *
 * @description データ配列を組織IDでフィルタリングし、データ分離を実現します。
 * 他組織のデータが結果に含まれることを防ぎ、セキュリティを向上させます。
 *
 * @template T - 組織IDを持つデータ型
 * @function
 * @param {T[]} data - フィルタリング対象のデータ配列
 * @param {Id<'orgs'>} userOrgId - ユーザーの組織ID
 * @returns {T[]} フィルタリング済みデータ配列
 * @example
 * ```typescript
 * const allReports = await ctx.db.query('reports').collect();
 * const userReports = filterByOrg(allReports, user.orgId);
 * // ユーザーの組織のレポートのみ取得
 * ```
 * @since 1.0.0
 */
export function filterByOrg<T extends { orgId: Id<'orgs'> }>(
  data: T[],
  userOrgId: Id<'orgs'>
): T[] {
  return data.filter((item) => item.orgId === userOrgId);
}

/**
 * 監査ログイベント記録
 *
 * @description セキュリティ関連のアクションを監査ログに記録します。
 * コンプライアンス要件への対応とセキュリティ監視を支援します。
 *
 * @async
 * @function
 * @param {MutationCtx} ctx - Convex mutation context
 * @param {Id<'userProfiles'>} actorId - 操作実行者のユーザーID
 * @param {string} action - 実行されたアクション名
 * @param {any} payload - アクションの詳細データ
 * @param {Id<'orgs'>} orgId - 組織ID
 * @returns {Promise<void>} 記録完了
 * @example
 * ```typescript
 * await logAuditEvent(ctx, user._id, 'delete_report', {
 *   reportId: 'report123',
 *   reason: 'User requested deletion'
 * }, user.orgId);
 * ```
 * @since 1.0.0
 */
export async function logAuditEvent(
  ctx: MutationCtx,
  actorId: Id<'userProfiles'>,
  action: string,
  payload: any,
  orgId: Id<'orgs'>
): Promise<void> {
  await ctx.db.insert('audit_logs', {
    actor_id: actorId,
    action,
    payload,
    org_id: orgId,
    created_at: Date.now(),
  });
}
