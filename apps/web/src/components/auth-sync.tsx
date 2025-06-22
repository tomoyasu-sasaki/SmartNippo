'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

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
