'use client';

import { AuthSync } from '@/components/auth-sync';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirect('/dashboard');
    }
  }, [isLoaded, isSignedIn]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>読み込み中...</p>
        </div>
      </div>
    );
  }

  // Show landing page for signed out users
  return (
    <>
      <AuthSync />
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          <header className='text-center mb-12 mt-20'>
            <h1 className='text-5xl font-bold text-gray-900 mb-4'>SmartNippo</h1>
            <p className='text-xl text-gray-600'>効率的な日報管理システム</p>
          </header>

          <Card className='max-w-md mx-auto'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl'>ようこそ SmartNippo へ</CardTitle>
              <CardDescription>日報管理システムを利用するにはログインしてください</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-gray-600 text-center mb-6'>
                SmartNippoは、チームの日報を効率的に管理するためのシステムです。
                日報の作成・閲覧・承認をスムーズに行えます。
              </p>
              <div className='flex flex-col gap-3'>
                <SignInButton mode='modal'>
                  <Button className='w-full' size='lg'>
                    ログイン
                  </Button>
                </SignInButton>
                <SignUpButton mode='modal'>
                  <Button variant='outline' className='w-full' size='lg'>
                    新規登録
                  </Button>
                </SignUpButton>
              </div>
            </CardContent>
          </Card>

          <div className='mt-12 text-center text-sm text-gray-500'>
            <p>&copy; 2024 SmartNippo. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
