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

import { REPORTS_CONSTANTS } from '@smartnippo/lib';

import type { ReportStatus } from '@/types';

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
  const currentUser = useQuery(api.index.current);

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
          <p className='mt-2 text-gray-600'>{REPORTS_CONSTANTS.LOADING_MESSAGE}</p>
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
    return REPORTS_CONSTANTS.STATUS[status];
  };

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>{REPORTS_CONSTANTS.PAGE_TITLE}</h1>
          <p className='text-gray-600 mt-1'>{REPORTS_CONSTANTS.PAGE_DESCRIPTION}</p>
        </div>
        <Link href='/reports/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            {REPORTS_CONSTANTS.CREATE_NEW_BUTTON}
          </Button>
        </Link>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>{REPORTS_CONSTANTS.FILTER_CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <Button
              variant='outline'
              className='justify-start text-muted-foreground'
              onClick={() => router.push('/reports/search')}
            >
              <Search className='mr-2 h-4 w-4' />
              {REPORTS_CONSTANTS.SEARCH_PLACEHOLDER}
            </Button>
            <Select
              value={queryStates.status ?? 'all'}
              onValueChange={(value) => setQueryStates((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={REPORTS_CONSTANTS.STATUS_FILTER_PLACEHOLDER} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{REPORTS_CONSTANTS.STATUS_ALL}</SelectItem>
                <SelectItem value='draft'>{REPORTS_CONSTANTS.STATUS.draft.label}</SelectItem>
                <SelectItem value='submitted'>
                  {REPORTS_CONSTANTS.STATUS.submitted.label}
                </SelectItem>
                <SelectItem value='approved'>{REPORTS_CONSTANTS.STATUS.approved.label}</SelectItem>
                <SelectItem value='rejected'>{REPORTS_CONSTANTS.STATUS.rejected.label}</SelectItem>
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
              {REPORTS_CONSTANTS.RESET_FILTER_BUTTON}
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
                    {REPORTS_CONSTANTS.TABLE_HEADER.DATE}
                    <ArrowUpDown className='h-4 w-4' />
                  </div>
                </TableHead>
                <TableHead>{REPORTS_CONSTANTS.TABLE_HEADER.TITLE}</TableHead>
                <TableHead>{REPORTS_CONSTANTS.TABLE_HEADER.AUTHOR}</TableHead>
                <TableHead>{REPORTS_CONSTANTS.TABLE_HEADER.STATUS}</TableHead>
                <TableHead className='cursor-pointer' onClick={() => handleSort('created_at')}>
                  <div className='flex items-center gap-1'>
                    {REPORTS_CONSTANTS.TABLE_HEADER.CREATED_AT}
                    <ArrowUpDown className='h-4 w-4' />
                  </div>
                </TableHead>
                <TableHead className='text-right'>
                  {REPORTS_CONSTANTS.TABLE_HEADER.ACTIONS}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <div className='flex flex-col items-center gap-2'>
                      <FileText className='h-8 w-8 text-gray-400' />
                      <p className='text-gray-500'>{REPORTS_CONSTANTS.NO_REPORTS_MESSAGE}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.reports.map((report) => {
                  const statusInfo = getStatusBadge(report.status);
                  const isOwner = currentUser?._id === report.authorId;
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
                      <TableCell>
                        {report.author?.name ?? REPORTS_CONSTANTS.UNKNOWN_AUTHOR}
                      </TableCell>
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
                              {REPORTS_CONSTANTS.ACTION_BUTTON_DETAILS}
                            </Button>
                          </Link>
                          {isOwner && report.status === 'draft' && (
                            <Link href={`/reports/${report._id}/edit`}>
                              <Button variant='ghost' size='sm'>
                                {REPORTS_CONSTANTS.ACTION_BUTTON_EDIT}
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
                {REPORTS_CONSTANTS.PAGINATION_SUMMARY(reports.totalCount, reports.reports.length)}
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
                  {REPORTS_CONSTANTS.PAGINATION_PREVIOUS}
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
                  {REPORTS_CONSTANTS.PAGINATION_NEXT}
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
