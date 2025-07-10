'use client';

import { REPORT_STATUS_LABELS } from '@smartnippo/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { Doc } from 'convex/_generated/dataModel';
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

// 日報データの型 (Convexの型を流用)
export type Report = Doc<'reports'> & {
  author: Doc<'userProfiles'> | null;
};

// ステータスに応じたBadgeのスタイル
const statusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'rejected':
      return 'secondary';
    case 'submitted':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const columns: ColumnDef<Report>[] = [
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
      const report = row.original as Report;
      return <div>{report.author?.clerkId ?? 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'ステータス',
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.getValue('status'))} className='capitalize'>
        {REPORT_STATUS_LABELS[row.getValue('status') as keyof typeof REPORT_STATUS_LABELS]}
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
