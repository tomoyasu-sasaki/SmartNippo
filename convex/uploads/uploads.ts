/**
 * @fileoverview ファイルアップロード機能
 *
 * @description ユーザーアバターのアップロード、保存、削除、URL取得、バリデーション、
 * および統計情報取得に関する機能を提供します。Convex File Storage を使用し、
 * セキュアなファイル管理を実現します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUser } from '../auth/auth';

/**
 * アバターファイル制限設定
 *
 * @description アバターとしてアップロード可能なファイルの最大サイズ、許可される
 * MIMEタイプ、最大画像寸法を定義します。
 *
 * @constant
 * @readonly
 * @since 1.0.0
 */
const AVATAR_LIMITS = {
  /** 最大ファイルサイズ (5MB) */
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  /** 許可されるファイルタイプ */
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const,
  /** 最大画像寸法 (px) */
  MAX_DIMENSION: 2048, // 最大2048px
} as const;

/**
 * アバターアップロード用URLの生成
 *
 * @description 認証済みユーザーに対して、1時間有効な一意のアップロードURLを生成します。
 * クライアントはこのURLを使用して直接ファイルをアップロードできます。
 *
 * @mutation
 * @returns {Promise<string>} アップロード用URL
 * @throws {Error} 認証されていない場合
 * @example
 * ```typescript
 * const uploadUrl = await generateAvatarUploadUrl();
 * // クライアント側でこのURLにファイルをPOSTする
 * ```
 * @since 1.0.0
 */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('Authentication required for avatar upload');
    }

    // アップロードURL生成（1時間有効）
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * アップロード済みアバターのプロフィールへの保存
 *
 * @description アップロードが完了したファイルのstorageIdをユーザープロファイルに保存します。
 * ファイルの形式とサイズを検証し、古いアバターが存在する場合は削除します。
 *
 * @mutation
 * @param {Object} args - ファイル情報
 * @param {Id<'_storage'>} args.storageId - アップロードされたファイルのstorageId
 * @param {number} args.fileSize - ファイルサイズ（バイト）
 * @param {string} args.fileType - ファイルのMIMEタイプ
 * @param {string} [args.fileName] - ファイル名
 * @returns {Promise<{success: boolean, url: string}>} 保存結果とファイルURL
 * @throws {Error} 認証失敗、ファイル形式またはサイズ違反、URL取得失敗の場合
 * @example
 * ```typescript
 * const result = await saveAvatarToProfile({
 *   storageId: uploadedFileId,
 *   fileSize: 102400, // 100KB
 *   fileType: 'image/png',
 *   fileName: 'my-avatar.png'
 * });
 * console.log('Avatar URL:', result.url);
 * ```
 * @since 1.0.0
 */
export const saveAvatarToProfile = mutation({
  args: {
    storageId: v.id('_storage'),
    fileSize: v.number(),
    fileType: v.string(),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // ファイル形式チェック
    if (!AVATAR_LIMITS.ALLOWED_TYPES.includes(args.fileType as any)) {
      throw new Error(
        `Unsupported file type: ${args.fileType}. Allowed types: ${AVATAR_LIMITS.ALLOWED_TYPES.join(', ')}`
      );
    }

    // ファイルサイズチェック
    if (args.fileSize > AVATAR_LIMITS.MAX_SIZE) {
      throw new Error(
        `File size ${args.fileSize} exceeds maximum allowed size of ${AVATAR_LIMITS.MAX_SIZE} bytes`
      );
    }

    // 古いアバターが存在する場合は削除
    if (user.avatarStorageId) {
      try {
        await ctx.storage.delete(user.avatarStorageId);
      } catch (error) {
        // 削除エラーは無視（ファイルが既に存在しない可能性）
        console.warn('Failed to delete old avatar:', error);
      }
    }

    // プロフィール更新
    await ctx.db.patch(user._id, {
      avatarStorageId: args.storageId,
      updated_at: Date.now(),
    });

    // 監査ログ記録
    if (user.orgId) {
      await ctx.db.insert('audit_logs', {
        actor_id: user._id,
        action: 'update_avatar',
        payload: {
          newStorageId: args.storageId,
          fileName: args.fileName,
          fileSize: args.fileSize,
          fileType: args.fileType,
        },
        created_at: Date.now(),
        org_id: user.orgId,
      });
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error('Could not get URL for uploaded file.');
    }

    return { success: true, url };
  },
});

/**
 * ユーザーアバターの削除
 *
 * @description 現在のユーザーアバターをConvex File Storageから削除し、
 * プロフィール情報から関連付けを解除します。
 *
 * @mutation
 * @returns {Promise<{success: boolean}>} 削除成功を示すオブジェクト
 * @throws {Error} 認証失敗または削除対象アバターが存在しない場合
 * @example
 * ```typescript
 * await deleteAvatar();
 * console.log('Avatar deleted successfully.');
 * ```
 * @since 1.0.0
 */
export const deleteAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    if (!user.avatarStorageId) {
      throw new Error('No avatar to delete');
    }

    // ストレージからファイル削除
    try {
      await ctx.storage.delete(user.avatarStorageId);
    } catch (error) {
      console.warn('Failed to delete avatar file:', error);
    }

    // プロフィールから参照削除（avatarUrlにリセット）
    const updateData: any = {
      avatarUrl: user.avatarUrl,
      updated_at: Date.now(),
    };
    // avatarStorageIdを削除
    const updatedUser = { ...user };
    delete updatedUser.avatarStorageId;
    await ctx.db.replace(user._id, updatedUser);

    // 監査ログ記録
    if (user.orgId) {
      await ctx.db.insert('audit_logs', {
        actor_id: user._id,
        action: 'delete_avatar',
        payload: {
          deletedStorageId: user.avatarStorageId,
        },
        created_at: Date.now(),
        org_id: user.orgId,
      });
    }

    return { success: true };
  },
});

/**
 * アバター画像のURL取得
 *
 * @description 指定されたユーザーのアバター画像のURLを取得します。
 * Convex File Storageに保存されている場合はそのURLを、ない場合は
 * 従来の外部URL（`avatarUrl`）にフォールバックします。
 *
 * @query
 * @param {Object} args - 取得対象
 * @param {Id<'userProfiles'>} args.userId - 対象ユーザーのID
 * @returns {Promise<{url: string, source: 'storage' | 'external'} | null>} URLとソース情報、またはnull
 * @example
 * ```typescript
 * const avatarInfo = await getAvatarUrl({ userId: 'user123' });
 * if (avatarInfo) {
 *   console.log(`Avatar URL: ${avatarInfo.url} (from ${avatarInfo.source})`);
 * }
 * ```
 * @since 1.0.0
 */
export const getAvatarUrl = query({
  args: { userId: v.id('userProfiles') },
  handler: async (ctx, args) => {
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return null;
    }

    // Convex File Storage URLを取得
    if (targetUser.avatarStorageId) {
      try {
        const url = await ctx.storage.getUrl(targetUser.avatarStorageId);
        return { url, source: 'storage' };
      } catch (error) {
        console.warn('Failed to get avatar URL from storage:', error);
      }
    }

    // レガシーの外部URLにフォールバック
    if (targetUser.avatarUrl) {
      return { url: targetUser.avatarUrl, source: 'external' };
    }

    return null;
  },
});

/**
 * アバターファイルの事前バリデーション
 *
 * @description ファイルアップロード前にクライアントサイドでファイルの妥当性を
 * 確認するためのバリデーション関数です。ファイルサイズ、タイプ、名前の長さを検証します。
 *
 * @mutation
 * @param {Object} args - 検証対象のファイル情報
 * @param {number} args.fileSize - ファイルサイズ（バイト）
 * @param {string} args.fileType - ファイルのMIMEタイプ
 * @param {string} [args.fileName] - ファイル名
 * @returns {Promise<{valid: boolean, errors: string[], limits: typeof AVATAR_LIMITS}>} 検証結果
 * @throws {Error} 認証されていない場合
 * @example
 * ```typescript
 * const result = await validateAvatarFile({
 *   fileSize: 6 * 1024 * 1024, // 6MB
 *   fileType: 'image/bmp'
 * });
 * if (!result.valid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 * @since 1.0.0
 */
export const validateAvatarFile = mutation({
  args: {
    fileSize: v.number(),
    fileType: v.string(),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 認証チェック
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const errors: string[] = [];

    // ファイル形式チェック
    if (!AVATAR_LIMITS.ALLOWED_TYPES.includes(args.fileType as any)) {
      errors.push(`Unsupported file type: ${args.fileType}`);
    }

    // ファイルサイズチェック
    if (args.fileSize > AVATAR_LIMITS.MAX_SIZE) {
      errors.push(
        `File size ${Math.round((args.fileSize / 1024 / 1024) * 100) / 100}MB exceeds maximum of ${AVATAR_LIMITS.MAX_SIZE / 1024 / 1024}MB`
      );
    }

    // ファイル名チェック（オプション）
    if (args.fileName && args.fileName.length > 255) {
      errors.push('File name too long (max 255 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
      limits: AVATAR_LIMITS,
    };
  },
});

/**
 * アバターアップロード統計の取得（管理者向け）
 *
 * @description 組織内のアバターアップロード状況に関する統計情報を取得します。
 * 全ユーザー数、アバター設定済みユーザー数、ストレージ利用率などを集計します。
 *
 * @query
 * @returns {Promise<Object>} アバター統計情報
 * @throws {Error} 認証失敗または管理者権限がない場合
 * @example
 * ```typescript
 * const stats = await getUploadStats();
 * console.log(`Avatar coverage: ${stats.avatarCoverage}%`);
 * ```
 * @since 1.0.0
 */
export const getUploadStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // 組織内のアバターアップロード統計
    const profiles = await ctx.db
      .query('userProfiles')
      .withIndex('by_org', (q) => q.eq('orgId', user.orgId))
      .collect();

    const stats = {
      totalUsers: profiles.length,
      usersWithAvatar: profiles.filter((p) => p.avatarStorageId ?? p.avatarUrl).length,
      usersWithStorageAvatar: profiles.filter((p) => p.avatarStorageId).length,
      usersWithExternalAvatar: profiles.filter((p) => p.avatarUrl && !p.avatarStorageId).length,
    };

    return {
      ...stats,
      avatarCoverage: Math.round((stats.usersWithAvatar / stats.totalUsers) * 100),
    };
  },
});
