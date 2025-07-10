import { useUser } from '@clerk/nextjs';
import { type ClerkUnsafeMetadata } from '@smartnippo/lib';
import type { UnifiedUserProfile } from '@smartnippo/types';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';

/**
 * Clerkのユーザー情報とConvexのuserProfilesを統合するカスタムフック
 */
export function useUnifiedUserProfile(): {
  isLoaded: boolean;
  user: UnifiedUserProfile | null;
  error?: string;
} {
  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const convexProfile = useQuery(api.index.current);

  if (!clerkLoaded) {
    return { isLoaded: false, user: null };
  }

  if (!clerkUser) {
    return { isLoaded: true, user: null };
  }

  if (convexProfile === undefined) {
    return { isLoaded: false, user: null };
  }

  if (!convexProfile) {
    return {
      isLoaded: true,
      user: null,
      error: 'Convexプロフィールが見つかりません',
    };
  }

  try {
    // Clerkのメタデータを安全に取得
    const metadata = clerkUser.unsafeMetadata as ClerkUnsafeMetadata;

    // 統合されたユーザープロフィールを作成
    const unifiedProfile: UnifiedUserProfile = {
      // Clerk情報
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      fullName: clerkUser.fullName,
      emailAddress: clerkUser.emailAddresses[0]?.emailAddress || null,
      emailAddresses: clerkUser.emailAddresses.map((email) => ({
        id: email.id!,
        emailAddress: email.emailAddress!,
        verified: email.verification?.status === 'verified',
        primary: clerkUser.primaryEmailAddressId === email.id,
      })),
      imageUrl: clerkUser.imageUrl,
      phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || null,

      // Convex情報
      convexId: convexProfile._id,
      role: convexProfile.role,
      ...(convexProfile.orgId !== undefined && { orgId: String(convexProfile.orgId) }),

      // メタデータ（Clerkから）
      ...(metadata?.socialLinks !== undefined && { socialLinks: metadata.socialLinks as any }),
      ...(metadata?.privacySettings !== undefined && {
        privacySettings: metadata.privacySettings as any,
      }),
      ...(metadata?.preferences !== undefined && { preferences: metadata.preferences as any }),
      ...(metadata?.notifications !== undefined && {
        notifications: metadata.notifications as any,
      }),

      // タイムスタンプ
      createdAt: new Date(clerkUser.createdAt!),
      updatedAt: new Date(clerkUser.updatedAt!),
    };

    return { isLoaded: true, user: unifiedProfile };
  } catch (error) {
    console.error('Error creating unified user profile:', error);
    return {
      isLoaded: true,
      user: null,
      error: 'ユーザープロフィールの作成中にエラーが発生しました',
    };
  }
}
