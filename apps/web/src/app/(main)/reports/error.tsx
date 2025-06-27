'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_CONSTANTS } from '@/constants/common';
import { REPORTS_CONSTANTS } from '@/constants/reports';
import { ArrowLeft, FileX, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // エラーをログサービスに送信
    console.error('Reports error:', error);
  }, [error]);

  const getErrorMessage = () => {
    if (error.message.includes('permission')) {
      return REPORTS_CONSTANTS.REPORTS_ERROR_PERMISSION;
    }
    if (error.message.includes('not found')) {
      return REPORTS_CONSTANTS.REPORTS_ERROR_NOT_FOUND;
    }
    if (error.message.includes('network')) {
      return REPORTS_CONSTANTS.REPORTS_ERROR_NETWORK;
    }
    return REPORTS_CONSTANTS.REPORTS_ERROR_GENERAL;
  };

  return (
    <div className='flex items-center justify-center min-h-[70vh] p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <FileX className='h-12 w-12 text-muted-foreground' />
          </div>
          <CardTitle className='text-2xl'>{REPORTS_CONSTANTS.REPORTS_ERROR_TITLE}</CardTitle>
          <CardDescription>{getErrorMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {process.env.NODE_ENV === 'development' && error.message && (
              <details className='text-sm'>
                <summary className='cursor-pointer text-muted-foreground'>
                  {REPORTS_CONSTANTS.REPORTS_ERROR_DETAILS_SUMMARY}
                </summary>
                <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
                  {error.message}
                </pre>
              </details>
            )}
            <div className='flex gap-3'>
              <Button onClick={() => router.back()} variant='outline' className='flex-1'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                {REPORTS_CONSTANTS.BACK_BUTTON}
              </Button>
              <Button onClick={reset} className='flex-1'>
                <RefreshCw className='h-4 w-4 mr-2' />
                {COMMON_CONSTANTS.RETRY_BUTTON}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
