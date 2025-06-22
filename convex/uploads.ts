import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./lib/auth";

// ファイル制限設定
const AVATAR_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ] as const,
  MAX_DIMENSION: 2048, // 最大2048px
} as const;

/**
 * アバターアップロードURL生成
 * 認証が必要で、1時間有効なアップロードURLを返す
 */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required for avatar upload");
    }

    // アップロードURL生成（1時間有効）
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * アバター保存
 * アップロード完了後にユーザープロフィールにStorageIDを保存
 */
export const saveAvatarToProfile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // ファイル形式チェック
    if (!AVATAR_LIMITS.ALLOWED_TYPES.includes(args.fileType as any)) {
      throw new Error(`Unsupported file type: ${args.fileType}. Allowed types: ${AVATAR_LIMITS.ALLOWED_TYPES.join(', ')}`);
    }

    // ファイルサイズチェック
    if (args.fileSize > AVATAR_LIMITS.MAX_SIZE) {
      throw new Error(`File size ${args.fileSize} exceeds maximum allowed size of ${AVATAR_LIMITS.MAX_SIZE} bytes`);
    }

    // 古いアバターが存在する場合は削除
    if (user.avatarStorageId) {
      try {
        await ctx.storage.delete(user.avatarStorageId);
      } catch (error) {
        // 削除エラーは無視（ファイルが既に存在しない可能性）
        console.warn("Failed to delete old avatar:", error);
      }
    }

    // プロフィール更新
    await ctx.db.patch(user._id, {
      avatarStorageId: args.storageId,
      updated_at: Date.now(),
    });

    // 監査ログ記録
    if (user.orgId) {
      await ctx.db.insert("audit_logs", {
        actor_id: user._id,
        action: "update_avatar",
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
      throw new Error("Could not get URL for uploaded file.");
    }

    return { success: true, url };
  },
});

/**
 * アバター削除
 * ユーザー自身のアバターを削除
 */
export const deleteAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    if (!user.avatarStorageId) {
      throw new Error("No avatar to delete");
    }

    // ストレージからファイル削除
    try {
      await ctx.storage.delete(user.avatarStorageId);
    } catch (error) {
      console.warn("Failed to delete avatar file:", error);
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
      await ctx.db.insert("audit_logs", {
        actor_id: user._id,
        action: "delete_avatar",
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
 * アバターURL取得
 * ユーザーのアバター画像URLを取得（キャッシュ対応）
 */
export const getAvatarUrl = query({
  args: { userId: v.id("userProfiles") },
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
        console.warn("Failed to get avatar URL from storage:", error);
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
 * ファイル形式バリデーション（HTTP Action用）
 * アップロード前にクライアントで使用
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
      throw new Error("Authentication required");
    }

    const errors: string[] = [];

    // ファイル形式チェック
    if (!AVATAR_LIMITS.ALLOWED_TYPES.includes(args.fileType as any)) {
      errors.push(`Unsupported file type: ${args.fileType}`);
    }

    // ファイルサイズチェック
    if (args.fileSize > AVATAR_LIMITS.MAX_SIZE) {
      errors.push(`File size ${Math.round(args.fileSize / 1024 / 1024 * 100) / 100}MB exceeds maximum of ${AVATAR_LIMITS.MAX_SIZE / 1024 / 1024}MB`);
    }

    // ファイル名チェック（オプション）
    if (args.fileName && args.fileName.length > 255) {
      errors.push("File name too long (max 255 characters)");
    }

    return {
      valid: errors.length === 0,
      errors,
      limits: AVATAR_LIMITS,
    };
  },
});

/**
 * アップロード統計取得（管理者用）
 */
export const getUploadStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user || user.role !== 'admin') {
      throw new Error("Admin access required");
    }

    // 組織内のアバターアップロード統計
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId))
      .collect();

    const stats = {
      totalUsers: profiles.length,
      usersWithAvatar: profiles.filter(p => p.avatarStorageId ?? p.avatarUrl).length,
      usersWithStorageAvatar: profiles.filter(p => p.avatarStorageId).length,
      usersWithExternalAvatar: profiles.filter(p => p.avatarUrl && !p.avatarStorageId).length,
    };

    return {
      ...stats,
      avatarCoverage: Math.round((stats.usersWithAvatar / stats.totalUsers) * 100),
    };
  },
});
