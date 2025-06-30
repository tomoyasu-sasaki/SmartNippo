import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { LoadingScreen } from '../ui/loading-screen';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = '/(auth)' }: AuthGuardProps) {
  const { user, isLoaded } = useUser();

  // 認証状態の読み込み中
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // 未認証の場合は認証画面へリダイレクト
  if (!user) {
    return <Redirect href={redirectTo} />;
  }

  return <>{children}</>;
}
