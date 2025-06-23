import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';

/**
 * 認証されたユーザーを取得
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<'userProfiles'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query('userProfiles')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  return user;
}

/**
 * 認証必須チェック - 認証されていない場合は例外をthrow
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
 * 組織メンバーシップチェック
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
 * ロール別権限チェック
 */
export type UserRole = 'viewer' | 'user' | 'manager' | 'admin';

export function hasRole(user: Doc<'userProfiles'>, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    user: 2,
    manager: 3,
    admin: 4,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * 最小権限チェック - 指定されたロール以上が必要
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  requiredRole: UserRole,
  orgId?: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  const user = orgId
    ? await requireOrgMembership(ctx, orgId)
    : await requireAuthentication(ctx);

  if (!hasRole(user, requiredRole)) {
    throw new Error(`${requiredRole}以上の権限が必要です`);
  }

  return user;
}

/**
 * リソース所有者チェック - 自分のリソースまたは管理者権限
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
 * 読取専用アクセスチェック
 */
export async function requireReadAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  return await requireRole(ctx, 'viewer', orgId);
}

/**
 * 書込アクセスチェック
 */
export async function requireWriteAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  return await requireRole(ctx, 'user', orgId);
}

/**
 * 管理者アクセスチェック
 */
export async function requireAdminAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'orgs'>
): Promise<Doc<'userProfiles'>> {
  return await requireRole(ctx, 'admin', orgId);
}

/**
 * データ分離チェック - クエリ結果を組織でフィルタ
 */
export function filterByOrg<T extends { orgId: Id<'orgs'> }>(
  data: T[],
  userOrgId: Id<'orgs'>
): T[] {
  return data.filter(item => item.orgId === userOrgId);
}

/**
 * 監査ログ記録
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
