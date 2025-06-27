'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundaryProvider } from '@/providers/error-boundary-provider';
import { useAuth } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { useConvexAuth, useQuery } from 'convex/react';
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
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DASHBOARD_CONSTANTS } from '@/constants/dashboard';
import { REPORTS_CONSTANTS } from '@/constants/reports';

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
  const { isLoading: isAuthLoading } = useConvexAuth();
  const router = useRouter();

  // クライアント側でセッションが無効になった場合、/login へリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !userId) {
      router.replace('/login');
    }
  }, [isAuthLoading, userId, router]);

  // 今月の日報データを取得
  const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const myReports = useQuery(api.index.getMyReports, {
    startDate,
    endDate,
  });

  const allReports = useQuery(api.index.listReports, {
    startDate,
    endDate,
    limit: 100,
  });

  // 最近の日報を取得（過去7日間）
  const recentStartDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const recentReports = useQuery(api.index.listReports, {
    startDate: recentStartDate,
    endDate: format(new Date(), 'yyyy-MM-dd'),
    limit: 5,
    sortBy: 'reportDate',
    sortOrder: 'desc',
  });

  const chartData = useQuery(api.index.getDashboardStats);

  // ローディング状態
  if (
    isAuthLoading ||
    myReports === undefined ||
    allReports === undefined ||
    recentReports === undefined ||
    chartData === undefined
  ) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>{DASHBOARD_CONSTANTS.LOADING_MESSAGE}</p>
        </div>
      </div>
    );
  }

  // null チェック (isAuthLoading 後は null になりうる)
  if (!myReports || !allReports || !recentReports) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-red-500'>データの読み込み中にエラーが発生しました。</p>
      </div>
    );
  }

  // 統計情報の計算
  const stats = {
    total: myReports.reports.length,
    draft: myReports.reports.filter((r: Doc<'reports'>) => r.status === 'draft').length,
    submitted: myReports.reports.filter((r: Doc<'reports'>) => r.status === 'submitted').length,
    approved: myReports.reports.filter((r: Doc<'reports'>) => r.status === 'approved').length,
    rejected: myReports.reports.filter((r: Doc<'reports'>) => r.status === 'rejected').length,
  };

  const teamStats = {
    total: allReports.reports.length,
    pendingApproval: allReports.reports.filter((r: Doc<'reports'>) => r.status === 'submitted')
      .length,
  };

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>{DASHBOARD_CONSTANTS.PAGE_TITLE}</h1>
          <p className='text-gray-600 mt-1'>
            {format(new Date(), 'yyyy年M月d日（E）', { locale: ja })}
          </p>
        </div>
        <Link href='/reports/new'>
          <Button>
            <FileText className='mr-2 h-4 w-4' />
            {DASHBOARD_CONSTANTS.CREATE_REPORT_BUTTON}
          </Button>
        </Link>
      </div>

      {/* 統計カード */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {DASHBOARD_CONSTANTS.STATS_CARD.THIS_MONTH_REPORTS_TITLE}
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>
              {DASHBOARD_CONSTANTS.STATS_CARD.THIS_MONTH_REPORTS_DESC}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {DASHBOARD_CONSTANTS.STATS_CARD.APPROVED_TITLE}
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.approved}</div>
            <p className='text-xs text-muted-foreground'>
              {DASHBOARD_CONSTANTS.STATS_CARD.APPROVAL_RATE(
                stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {DASHBOARD_CONSTANTS.STATS_CARD.PENDING_SUBMISSION_TITLE}
            </CardTitle>
            <Clock className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.draft}</div>
            <p className='text-xs text-muted-foreground'>
              {DASHBOARD_CONSTANTS.STATS_CARD.PENDING_SUBMISSION_DESC}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {DASHBOARD_CONSTANTS.STATS_CARD.PENDING_APPROVAL_TITLE}
            </CardTitle>
            <AlertCircle className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{teamStats.pendingApproval}</div>
            <p className='text-xs text-muted-foreground'>
              {DASHBOARD_CONSTANTS.STATS_CARD.PENDING_APPROVAL_DESC}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近の日報 */}
      <Card>
        <CardHeader>
          <CardTitle>{DASHBOARD_CONSTANTS.RECENT_REPORTS_CARD.TITLE}</CardTitle>
          <CardDescription>{DASHBOARD_CONSTANTS.RECENT_REPORTS_CARD.DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {recentReports.reports.length === 0 ? (
              <p className='text-center text-gray-500 py-8'>
                {DASHBOARD_CONSTANTS.RECENT_REPORTS_CARD.NO_REPORTS}
              </p>
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
                          REPORTS_CONSTANTS.STATUS[
                            report.status as keyof typeof REPORTS_CONSTANTS.STATUS
                          ].variant
                        }
                      >
                        {
                          REPORTS_CONSTANTS.STATUS[
                            report.status as keyof typeof REPORTS_CONSTANTS.STATUS
                          ].label
                        }
                      </Badge>
                    </div>
                    <div className='flex items-center gap-4 mt-1 text-sm text-gray-500'>
                      <span className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {format(new Date(report.reportDate), 'M月d日（E）', { locale: ja })}
                      </span>
                      <span>
                        {DASHBOARD_CONSTANTS.RECENT_REPORTS_CARD.AUTHOR_PREFIX}
                        {report.author?.name ?? REPORTS_CONSTANTS.UNKNOWN_AUTHOR}
                      </span>
                    </div>
                  </div>
                  <Link href={`/reports/${report._id}`}>
                    <Button variant='ghost' size='sm'>
                      {DASHBOARD_CONSTANTS.RECENT_REPORTS_CARD.VIEW_DETAILS_BUTTON}
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
          {recentReports.reports.length > 0 && (
            <div className='mt-4 text-center'>
              <Link href='/reports'>
                <Button variant='outline'>
                  {DASHBOARD_CONSTANTS.RECENT_REPORTS_CARD.VIEW_ALL_REPORTS_BUTTON}
                </Button>
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
              {DASHBOARD_CONSTANTS.QUICK_ACTIONS.MONTHLY_ACTIVITY_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>
                  {DASHBOARD_CONSTANTS.QUICK_ACTIONS.SUBMISSION_RATE_LABEL}
                </span>
                <span className='font-medium'>
                  {stats.total > 0
                    ? Math.round(((stats.submitted + stats.approved) / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>
                  {DASHBOARD_CONSTANTS.QUICK_ACTIONS.APPROVAL_RATE_LABEL}
                </span>
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
              {DASHBOARD_CONSTANTS.QUICK_ACTIONS.TEAM_STATUS_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>
                  {DASHBOARD_CONSTANTS.QUICK_ACTIONS.TEAM_TOTAL_REPORTS_LABEL}
                </span>
                <span className='font-medium'>{teamStats.total}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>
                  {DASHBOARD_CONSTANTS.QUICK_ACTIONS.TEAM_PENDING_APPROVAL_LABEL}
                </span>
                <span className='font-medium'>{teamStats.pendingApproval}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              {DASHBOARD_CONSTANTS.QUICK_ACTIONS.ACTIVITY_TREND_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ErrorBoundaryProvider>
                <ReportsChart data={chartData} />
              </ErrorBoundaryProvider>
            ) : (
              <p className='text-sm text-gray-600 text-center py-10'>
                {DASHBOARD_CONSTANTS.QUICK_ACTIONS.CHART_NO_DATA}
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
    <ErrorBoundaryProvider>
      <DashboardContentInner />
    </ErrorBoundaryProvider>
  );
}
