'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      return '日報へのアクセス権限がありません。';
    }
    if (error.message.includes('not found')) {
      return '指定された日報が見つかりません。';
    }
    if (error.message.includes('network')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
    return '日報の読み込み中にエラーが発生しました。';
  };

  return (
    <div className='flex items-center justify-center min-h-[70vh] p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <FileX className='h-12 w-12 text-muted-foreground' />
          </div>
          <CardTitle className='text-2xl'>日報エラー</CardTitle>
          <CardDescription>{getErrorMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {process.env.NODE_ENV === 'development' && error.message && (
              <details className='text-sm'>
                <summary className='cursor-pointer text-muted-foreground'>エラーの詳細</summary>
                <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
                  {error.message}
                </pre>
              </details>
            )}
            <div className='flex gap-3'>
              <Button onClick={() => router.back()} variant='outline' className='flex-1'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                戻る
              </Button>
              <Button onClick={reset} className='flex-1'>
                <RefreshCw className='h-4 w-4 mr-2' />
                再試行
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
