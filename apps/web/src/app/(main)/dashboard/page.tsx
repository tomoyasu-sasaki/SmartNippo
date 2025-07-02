import { DashboardContent } from '@/components/features/dashboard/dashboard-content';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@clerk/nextjs/server';
import { DASHBOARD_CONSTANTS } from '@smartnippo/lib';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: DASHBOARD_CONSTANTS.META_TITLE,
  description: DASHBOARD_CONSTANTS.META_DESCRIPTION,
};

// ダッシュボードのスケルトンローダー
function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* ヘッダースケルトン */}
      <div>
        <Skeleton className='h-9 w-32 mb-2' />
        <Skeleton className='h-5 w-48' />
      </div>

      {/* 統計カードスケルトン */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16 mb-1' />
              <Skeleton className='h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 最近の日報スケルトン */}
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48 mt-1' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='flex items-center justify-between p-2'>
                <div className='flex-1'>
                  <Skeleton className='h-5 w-48 mb-2' />
                  <Skeleton className='h-3 w-32' />
                </div>
                <Skeleton className='h-8 w-24' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* チャートエリアスケルトン */}
      <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-48 mt-1' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-56 w-full' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-48 mt-1' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-56 w-full' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-48 mt-1' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[130px] w-full' />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
