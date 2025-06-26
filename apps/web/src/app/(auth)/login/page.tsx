'use client';

import { AuthSync } from '@/components/features/auth/auth-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_CONSTANTS } from '@/constants/common';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth
  if (!isLoaded || isSignedIn) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>{COMMON_CONSTANTS.LOADING}</p>
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
            <h1 className='text-5xl font-bold text-gray-900 mb-4'>{COMMON_CONSTANTS.APP_NAME}</h1>
            <p className='text-xl text-gray-600'>{COMMON_CONSTANTS.APP_CATCHPHRASE}</p>
          </header>

          <Card className='max-w-md mx-auto'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl'>{COMMON_CONSTANTS.WELCOME_TITLE}</CardTitle>
              <CardDescription>{COMMON_CONSTANTS.LOGIN_PROMPT}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-gray-600 text-center mb-6 whitespace-pre-line'>
                {COMMON_CONSTANTS.SYSTEM_DESCRIPTION}
              </p>
              <div className='flex flex-col gap-3'>
                <SignInButton mode='modal'>
                  <Button className='w-full' size='lg'>
                    {COMMON_CONSTANTS.LOGIN_BUTTON}
                  </Button>
                </SignInButton>
                <SignUpButton mode='modal'>
                  <Button variant='outline' className='w-full' size='lg'>
                    {COMMON_CONSTANTS.SIGNUP_BUTTON}
                  </Button>
                </SignUpButton>
              </div>
            </CardContent>
          </Card>

          <div className='mt-12 text-center text-sm text-gray-500'>
            <p>{COMMON_CONSTANTS.COPYRIGHT}</p>
          </div>
        </div>
      </div>
    </>
  );
}
