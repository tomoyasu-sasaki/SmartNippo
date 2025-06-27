'use client';

import { usePathname } from 'next/navigation';

import { Header } from './header';

export const ConditionalNavigation = () => {
  const pathname = usePathname();

  // ログインページではナビゲーション（ヘッダー）を表示しない
  if (pathname === '/login') {
    return null;
  }

  return <Header />;
};
