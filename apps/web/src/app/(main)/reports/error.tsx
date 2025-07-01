'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_MESSAGES, ERROR_PAGE_CONSTANTS } from '@smartnippo/lib';
import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ReportsErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {}, [error]);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl text-red-600'>
            {ERROR_PAGE_CONSTANTS.ERROR_TITLE}
          </CardTitle>
          <CardDescription>{ERROR_PAGE_CONSTANTS.ERROR_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error.digest && (
            <div className='text-sm text-gray-600 bg-gray-100 p-3 rounded'>
              <strong>{ERROR_PAGE_CONSTANTS.ERROR_ID_PREFIX}</strong> {error.digest}
            </div>
          )}
          <div className='flex gap-2'>
            <Button onClick={reset} className='flex-1'>
              {COMMON_MESSAGES.RETRY}
            </Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/reports')}
              className='flex-1'
            >
              {ERROR_PAGE_CONSTANTS.REPORTS_BUTTON}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
