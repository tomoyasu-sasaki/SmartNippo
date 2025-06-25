'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

// Convex型定義を条件付きにする
interface ReportDoc {
  _id: string;
  title: string;
  content: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  reportDate: string;
  created_at: number;
  updated_at: number;
  author?: {
    _id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  } | null;
}

// ステータスに応じたBadgeのスタイル
const statusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'submitted':
      return 'secondary';
    default:
      return 'outline';
  }
};

// 日報データの型 (基本的な型定義)
export const createReportColumns = () => [
  {
    accessorKey: 'reportDate',
    header: '日付',
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
      const date = row.getValue('reportDate') as string;
      return new Date(date).toLocaleDateString('ja-JP');
    },
  },
  {
    accessorKey: 'title',
    header: 'タイトル',
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
      const title = row.getValue('title') as string;
      return (
        <div className='max-w-[200px] truncate font-medium' title={title}>
          {title}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'ステータス',
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
      const status = row.getValue('status') as ReportDoc['status'];
      const statusMap = {
        draft: { label: '下書き', variant: 'outline' as const },
        submitted: { label: '提出済み', variant: 'secondary' as const },
        approved: { label: '承認済み', variant: 'default' as const },
        rejected: { label: '却下', variant: 'destructive' as const },
      };
      const { label, variant } = statusMap[status];
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'author',
    header: '作成者',
    cell: ({ row }: { row: { getValue: (key: string) => ReportDoc['author'] } }) => {
      const author = row.getValue('author');
      return author?.name ?? '不明';
    },
  },
  {
    accessorKey: 'updated_at',
    header: '更新日時',
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => {
      const timestamp = row.getValue('updated_at') as number;
      return new Date(timestamp).toLocaleString('ja-JP');
    },
  },
];

export const columns: ColumnDef<ReportDoc>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          タイトル
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => <div className='font-medium'>{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'reportDate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          報告日
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'author',
    header: '作成者',
    cell: ({ row }) => {
      const report = row.original as ReportDoc;
      return <div>{report.author?.name ?? 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'ステータス',
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.getValue('status'))} className='capitalize'>
        {row.getValue('status')}
      </Badge>
    ),
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <div className='text-right'>
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          最終更新日
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updated_at'));
      const formatted = date.toLocaleDateString('ja-JP');
      return <div className='text-right font-medium'>{formatted}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const report = row.original;

      return (
        <div className='text-right'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>アクション</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(report._id)}>
                日報IDをコピー
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>詳細を表示</DropdownMenuItem>
              <DropdownMenuItem>編集</DropdownMenuItem>
              <DropdownMenuItem className='text-destructive'>削除</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
