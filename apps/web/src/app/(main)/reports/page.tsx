import { ReportsContent } from '@/components/features/reports/reports-content';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '日報一覧 | SmartNippo',
  description: '日報の作成・管理',
};

// 日報一覧のスケルトンローダー
function ReportsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* ヘッダースケルトン */}
      <div className='flex justify-between items-center'>
        <div>
          <Skeleton className='h-9 w-32 mb-2' />
          <Skeleton className='h-5 w-48' />
        </div>
        <Skeleton className='h-10 w-24' />
      </div>

      {/* フィルタースケルトン */}
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-20' />
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        </CardContent>
      </Card>

      {/* テーブルスケルトン */}
      <Card>
        <CardContent className='p-0'>
          <div className='p-4'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left p-2'>
                    <Skeleton className='h-4 w-12' />
                  </th>
                  <th className='text-left p-2'>
                    <Skeleton className='h-4 w-20' />
                  </th>
                  <th className='text-left p-2'>
                    <Skeleton className='h-4 w-16' />
                  </th>
                  <th className='text-left p-2'>
                    <Skeleton className='h-4 w-20' />
                  </th>
                  <th className='text-left p-2'>
                    <Skeleton className='h-4 w-24' />
                  </th>
                  <th className='text-right p-2'>
                    <Skeleton className='h-4 w-12' />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className='border-b'>
                    <td className='p-2'>
                      <Skeleton className='h-4 w-20' />
                    </td>
                    <td className='p-2'>
                      <Skeleton className='h-4 w-48' />
                    </td>
                    <td className='p-2'>
                      <Skeleton className='h-4 w-24' />
                    </td>
                    <td className='p-2'>
                      <Skeleton className='h-6 w-16' />
                    </td>
                    <td className='p-2'>
                      <Skeleton className='h-4 w-32' />
                    </td>
                    <td className='p-2 text-right'>
                      <div className='flex justify-end gap-2'>
                        <Skeleton className='h-8 w-12' />
                        <Skeleton className='h-8 w-12' />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}
