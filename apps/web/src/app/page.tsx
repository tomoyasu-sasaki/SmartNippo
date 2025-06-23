'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { AuthSync } from '@/components/auth-sync';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <AuthSync />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SmartNippo</h1>
              <p className="text-gray-600">日報管理システム</p>
        </div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button>ログイン</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline">新規登録</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
      </div>
          </header>

          <SignedOut>
            <Card>
              <CardHeader>
                <CardTitle>ようこそ SmartNippo へ</CardTitle>
                <CardDescription>
                  日報管理システムを利用するにはログインしてください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  SmartNippoは、チームの日報を効率的に管理するためのシステムです。
                  ログインして、日報の作成・閲覧・承認を行いましょう。
            </p>
              </CardContent>
            </Card>
          </SignedOut>

          <SignedIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>今日の日報</CardTitle>
                  <CardDescription>本日の作業内容を記録しましょう</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    日報を作成（準備中）
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>承認待ち</CardTitle>
                  <CardDescription>承認が必要な日報があります</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    確認する（準備中）
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>プロフィール</CardTitle>
                  <CardDescription>アカウント設定を変更</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/profile')}>
                    設定を開く
                  </Button>
                </CardContent>
              </Card>
          </div>
          </SignedIn>
        </div>
      </div>
    </>
  );
}
