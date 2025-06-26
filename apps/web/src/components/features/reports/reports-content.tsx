'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorBoundaryProvider } from '@/providers/error-boundary-provider';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
type SortBy = 'reportDate' | 'created_at' | 'updated_at' | 'submittedAt';
type SortOrder = 'asc' | 'desc';

interface Report {
  _id: string;
  reportDate: string;
  title: string;
  content: string;
  status: ReportStatus;
  authorId: string;
  created_at: number;
  author?: {
    _id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
}

interface QueryResult {
  reports: Report[];
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
}

function ReportsContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queryStates, setQueryStates] = useState({
    status: searchParams.get('status') ?? 'all',
    search: searchParams.get('search') ?? '',
    sortBy: searchParams.get('sortBy') ?? 'reportDate',
    sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc',
    page: searchParams.get('page') ?? '1',
  });
  const [debouncedSearch, setDebouncedSearch] = useState(queryStates.search);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push('/reports/search');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(queryStates.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [queryStates.search]);

  // Prepare query parameters
  const queryParams = {
    ...(queryStates.status &&
      queryStates.status !== 'all' && { status: queryStates.status as ReportStatus }),
    ...(debouncedSearch && { searchQuery: debouncedSearch }),
    sortBy: queryStates.sortBy as SortBy,
    sortOrder: queryStates.sortOrder as SortOrder,
    limit: 10,
    ...(queryStates.page !== '1' && { cursor: queryStates.page }),
  };

  // Fetch reports with filters
  const reports = useQuery(api.index.listReports, queryParams) as QueryResult | undefined;

  // Loading state
  if (!reports) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleSort = (field: string) => {
    const newSortOrder =
      queryStates.sortBy === field && queryStates.sortOrder === 'desc' ? 'asc' : 'desc';
    setQueryStates({
      ...queryStates,
      sortBy: field,
      sortOrder: newSortOrder,
    });
  };

  const getStatusBadge = (status: ReportStatus) => {
    const variants: Record<ReportStatus, any> = {
      draft: { variant: 'outline' as const, label: '下書き' },
      submitted: { variant: 'secondary' as const, label: '提出済み' },
      approved: { variant: 'default' as const, label: '承認済み' },
      rejected: { variant: 'destructive' as const, label: '却下' },
    };
    return variants[status];
  };

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>日報一覧</h1>
          <p className='text-gray-600 mt-1'>日報の作成・管理</p>
        </div>
        <Link href='/reports/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            新規作成
          </Button>
        </Link>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <Button
              variant='outline'
              className='justify-start text-muted-foreground'
              onClick={() => router.push('/reports/search')}
            >
              <Search className='mr-2 h-4 w-4' />
              タイトルや内容で検索... (⌘K)
            </Button>
            <Select
              value={queryStates.status ?? 'all'}
              onValueChange={(value) => setQueryStates((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder='ステータスで絞り込み' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>すべて</SelectItem>
                <SelectItem value='draft'>下書き</SelectItem>
                <SelectItem value='submitted'>提出済み</SelectItem>
                <SelectItem value='approved'>承認済み</SelectItem>
                <SelectItem value='rejected'>却下</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              onClick={() =>
                setQueryStates({
                  status: 'all',
                  search: '',
                  sortBy: 'reportDate',
                  sortOrder: 'desc',
                  page: '1',
                })
              }
            >
              <Filter className='mr-2 h-4 w-4' />
              フィルターをリセット
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日報テーブル */}
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='cursor-pointer' onClick={() => handleSort('reportDate')}>
                  <div className='flex items-center gap-1'>
                    日付
                    <ArrowUpDown className='h-4 w-4' />
                  </div>
                </TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead>作成者</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className='cursor-pointer' onClick={() => handleSort('created_at')}>
                  <div className='flex items-center gap-1'>
                    作成日時
                    <ArrowUpDown className='h-4 w-4' />
                  </div>
                </TableHead>
                <TableHead className='text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <div className='flex flex-col items-center gap-2'>
                      <FileText className='h-8 w-8 text-gray-400' />
                      <p className='text-gray-500'>日報が見つかりません</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.reports.map((report) => {
                  const statusInfo = getStatusBadge(report.status);
                  return (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4 text-gray-400' />
                          {format(new Date(report.reportDate), 'M月d日（E）', {
                            locale: ja,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/reports/${report._id}`}
                          className='font-medium hover:underline'
                        >
                          {report.title}
                        </Link>
                      </TableCell>
                      <TableCell>{report.author?.name ?? 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm')}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Link href={`/reports/${report._id}`}>
                            <Button variant='ghost' size='sm'>
                              詳細
                            </Button>
                          </Link>
                          {report.status === 'draft' && (
                            <Link href={`/reports/${report._id}/edit`}>
                              <Button variant='ghost' size='sm'>
                                編集
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* ページネーション */}
          {reports.reports.length > 0 && (
            <div className='flex items-center justify-between px-6 py-4 border-t'>
              <p className='text-sm text-gray-600'>
                全 {reports.totalCount} 件中 {reports.reports.length} 件を表示
              </p>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setQueryStates((prev) => ({
                      ...prev,
                      page: String(Math.max(1, parseInt(prev.page) - 1)),
                    }))
                  }
                  disabled={queryStates.page === '1'}
                >
                  <ChevronLeft className='h-4 w-4' />
                  前へ
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setQueryStates((prev) => ({
                      ...prev,
                      page: reports.nextCursor ?? prev.page,
                    }))
                  }
                  disabled={!reports.hasMore}
                >
                  次へ
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsContent() {
  return (
    <ErrorBoundaryProvider>
      <ReportsContentInner />
    </ErrorBoundaryProvider>
  );
}
