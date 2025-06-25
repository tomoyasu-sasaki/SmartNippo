'use client';

import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const ReportsChart = dynamic(
  () => import('@/components/ui/reports-chart').then((mod) => mod.ReportsChart),
  {
    ssr: false,
    loading: () => <Skeleton className='h-[200px] w-full' />,
  }
);

// No longer need manual type definitions, they will be inferred from `api`
// interface Report { ... }
// interface QueryResult { ... }

function DashboardContentInner() {
  const { userId } = useAuth();

  // 今月の日報データを取得
  const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const myReports = useQuery(api.reports.getMyReports, {
    startDate,
    endDate,
  });

  const allReports = useQuery(api.reports.listReports, {
    startDate,
    endDate,
    limit: 100,
  });

  // 最近の日報を取得（過去7日間）
  const recentStartDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const recentReports = useQuery(api.reports.listReports, {
    startDate: recentStartDate,
    endDate: format(new Date(), 'yyyy-MM-dd'),
    limit: 5,
    sortBy: 'reportDate',
    sortOrder: 'desc',
  });

  const chartData = useQuery(api.reports.getDashboardStats);

  // ローディング状態
  if (!myReports || !allReports || !recentReports || chartData === undefined) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>読み込み中...</p>
        </div>
      </div>
    );
  }

  // 統計情報の計算
  const stats = {
    total: myReports.reports.length,
    draft: myReports.reports.filter((r) => r.status === 'draft').length,
    submitted: myReports.reports.filter((r) => r.status === 'submitted').length,
    approved: myReports.reports.filter((r) => r.status === 'approved').length,
    rejected: myReports.reports.filter((r) => r.status === 'rejected').length,
  };

  const teamStats = {
    total: allReports.reports.length,
    pendingApproval: allReports.reports.filter((r) => r.status === 'submitted').length,
  };

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>ダッシュボード</h1>
          <p className='text-gray-600 mt-1'>
            {format(new Date(), 'yyyy年M月d日（E）', { locale: ja })}
          </p>
        </div>
        <Link href='/reports/new'>
          <Button>
            <FileText className='mr-2 h-4 w-4' />
            日報を作成
          </Button>
        </Link>
      </div>

      {/* 統計カード */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>今月の日報</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>作成済み</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>承認済み</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.approved}</div>
            <p className='text-xs text-muted-foreground'>
              承認率 {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>提出待ち</CardTitle>
            <Clock className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.draft}</div>
            <p className='text-xs text-muted-foreground'>下書き</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>承認待ち</CardTitle>
            <AlertCircle className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{teamStats.pendingApproval}</div>
            <p className='text-xs text-muted-foreground'>チーム全体</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近の日報 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の日報</CardTitle>
          <CardDescription>過去7日間の日報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {recentReports.reports.length === 0 ? (
              <p className='text-center text-gray-500 py-8'>最近の日報はありません</p>
            ) : (
              recentReports.reports.map((report) => (
                <div
                  key={report._id}
                  className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-3'>
                      <h3 className='font-medium'>
                        <Link href={`/reports/${report._id}`} className='hover:underline'>
                          {report.title}
                        </Link>
                      </h3>
                      <Badge
                        variant={
                          report.status === 'approved'
                            ? 'default'
                            : report.status === 'submitted'
                              ? 'secondary'
                              : report.status === 'rejected'
                                ? 'destructive'
                                : 'outline'
                        }
                      >
                        {report.status === 'draft' && '下書き'}
                        {report.status === 'submitted' && '提出済み'}
                        {report.status === 'approved' && '承認済み'}
                        {report.status === 'rejected' && '却下'}
                      </Badge>
                    </div>
                    <div className='flex items-center gap-4 mt-1 text-sm text-gray-500'>
                      <span className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {format(new Date(report.reportDate), 'M月d日（E）', { locale: ja })}
                      </span>
                      <span>作成者: {report.author?.name ?? 'Unknown'}</span>
                    </div>
                  </div>
                  <Link href={`/reports/${report._id}`}>
                    <Button variant='ghost' size='sm'>
                      詳細を見る
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
          {recentReports.reports.length > 0 && (
            <div className='mt-4 text-center'>
              <Link href='/reports'>
                <Button variant='outline'>すべての日報を見る</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* クイックアクション */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              今月の活動
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>提出率</span>
                <span className='font-medium'>
                  {stats.total > 0
                    ? Math.round(((stats.submitted + stats.approved) / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>承認率</span>
                <span className='font-medium'>
                  {stats.submitted + stats.approved > 0
                    ? Math.round((stats.approved / (stats.submitted + stats.approved)) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              チーム状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>チーム全体の日報</span>
                <span className='font-medium'>{teamStats.total}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>承認待ち</span>
                <span className='font-medium'>{teamStats.pendingApproval}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              活動の推移 (過去30日)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ReportsChart data={chartData} />
            ) : (
              <p className='text-sm text-gray-600 text-center py-10'>
                チャートを表示するのに十分なデータがありません。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardContent() {
  return (
    <ErrorBoundaryWrapper>
      <DashboardContentInner />
    </ErrorBoundaryWrapper>
  );
}
