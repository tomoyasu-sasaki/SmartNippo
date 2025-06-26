'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_CONSTANTS } from '@/constants/common';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログサービスに送信
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className='flex items-center justify-center min-h-screen p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <AlertTriangle className='h-12 w-12 text-destructive' />
          </div>
          <CardTitle className='text-2xl'>{COMMON_CONSTANTS.ERROR_TITLE}</CardTitle>
          <CardDescription>{COMMON_CONSTANTS.ERROR_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {error.message && (
              <div className='p-3 bg-muted rounded-md'>
                <p className='text-sm text-muted-foreground font-mono'>{error.message}</p>
              </div>
            )}
            {error.digest && (
              <p className='text-xs text-muted-foreground text-center'>
                {COMMON_CONSTANTS.ERROR_ID_PREFIX} {error.digest}
              </p>
            )}
            <div className='flex gap-3'>
              <Button onClick={reset} className='flex-1' variant='outline'>
                <RefreshCw className='h-4 w-4 mr-2' />
                {COMMON_CONSTANTS.RETRY_BUTTON}
              </Button>
              <Link href='/' className='flex-1'>
                <Button className='w-full'>
                  <Home className='h-4 w-4 mr-2' />
                  {COMMON_CONSTANTS.HOME_BUTTON}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
