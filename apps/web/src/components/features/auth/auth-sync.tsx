'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';

export function AuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    // Clerkの認証状態が読み込まれ、ユーザーがサインインしている場合
    if (isLoaded && isSignedIn && user) {
      // Convexにユーザー情報を保存
      void storeUser();
    }
  }, [isLoaded, isSignedIn, user, storeUser]);

  return null;
}
