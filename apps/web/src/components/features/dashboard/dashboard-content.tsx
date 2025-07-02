'use client';

import { CustomActivityCalendar } from '@/components/ui/activity-calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportsChartProps } from '@/components/ui/reports-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundaryProvider } from '@/providers/error-boundary-provider';
import { DASHBOARD_CONSTANTS, REPORTS_CONSTANTS } from '@smartnippo/lib';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Hourglass,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ReactElement } from 'react';

const ReportsChart = dynamic(
  () => import('@/components/ui/reports-chart').then((mod) => mod.ReportsChart),
  {
    ssr: false,
    loading: () => <Skeleton className='h-[250px] w-full' />,
  }
) as <T extends object>(props: ReportsChartProps<T>) => ReactElement;

function DashboardContentInner() {
  const data = useQuery(api.reports.dashboard.getMyDashboardData, { days: 30 });

  if (data === undefined) {
    // スケルトンは page.tsx 側で Suspense fallback として表示
    return null;
  }

  if (data === null) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-red-500'>ダッシュボードデータの読み込み中にエラーが発生しました。</p>
      </div>
    );
  }

  const { stats, activityTrend, workingHoursTrend, recentReports, cumulativeWorkingHoursTrend } =
    data;

  const calendarData = activityTrend.map((day) => ({
    date: day.date,
    count: day.submitted,
    level: day.submitted > 0 ? 1 : 0,
  }));

  const getStatusInfo = (status: (typeof recentReports)[number]['status']) => {
    return REPORTS_CONSTANTS.STATUS[status] ?? { variant: 'default', label: '不明' };
  };

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>{DASHBOARD_CONSTANTS.PAGE_TITLE}</h1>
          <p className='text-gray-600 mt-1'>
            {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
          </p>
        </div>
        <Link href='/reports/new' passHref>
          <Button variant='outline'>
            <FileText className='mr-2 h-4 w-4' />
            {DASHBOARD_CONSTANTS.CREATE_REPORT_BUTTON}
          </Button>
        </Link>
      </div>

      {/* 統計カード */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>今月の日報</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.reportsThisMonth}</div>
            <p className='text-xs text-muted-foreground'>作成済み</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>承認済み</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.approvedThisMonth}</div>
            <p className='text-xs text-muted-foreground'>今月承認された日報</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>承認待ち</CardTitle>
            <Hourglass className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pendingApproval}</div>
            <p className='text-xs text-muted-foreground'>承認を待っている日報</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>下書き</CardTitle>
            <Edit className='h-4 w-4 text-gray-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.drafts}</div>
            <p className='text-xs text-muted-foreground'>保存されている下書き</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近の日報 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の日報</CardTitle>
          <CardDescription>過去7日間に作成または更新されたあなたの日報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {recentReports.length === 0 ? (
              <p className='text-center text-gray-500 py-6'>最近の日報はありません。</p>
            ) : (
              recentReports.map((report) => {
                const statusInfo = getStatusInfo(report.status);
                return (
                  <div
                    key={report._id}
                    className='flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors'
                  >
                    <div className='flex-1 truncate'>
                      <Link
                        href={`/reports/${report._id}`}
                        className='font-medium hover:underline truncate block'
                      >
                        {report.title}
                      </Link>
                      <div className='flex items-center gap-3 mt-1 text-sm text-muted-foreground'>
                        <span className='flex items-center gap-1.5'>
                          <Calendar className='h-3.5 w-3.5' />
                          {format(parseISO(report.reportDate), 'M月d日')}
                        </span>
                        <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                      </div>
                    </div>
                    <Link href={`/reports/${report._id}`} passHref>
                      <Button variant='ghost' size='sm'>
                        詳細を見る
                      </Button>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
          {recentReports.length > 0 && (
            <div className='mt-4 text-center'>
              <Link href='/reports' passHref>
                <Button variant='outline'>すべての日報を見る</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* チャートエリア */}
      <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='flex-row items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              業務時間の推移
            </CardTitle>
            <CardDescription>過去30日間の日別業務時間</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <ReportsChart
              data={workingHoursTrend}
              dataKey='hours'
              xAxisKey='date'
              chartType='bar'
              tooltipLabel='労働時間'
              unit='時間'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex-row items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              30日間累積時間
            </CardTitle>
            <CardDescription>過去30日間の累積業務時間</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <ReportsChart
              data={cumulativeWorkingHoursTrend}
              dataKey='cumulativeHours'
              xAxisKey='date'
              chartType='line'
              tooltipLabel='累積時間'
              unit='時間'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex-row items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              日報提出状況
            </CardTitle>
            <CardDescription>過去30日間の提出記録</CardDescription>
          </CardHeader>
          <CardContent className='flex justify-center items-center'>
            <CustomActivityCalendar data={calendarData} />
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
