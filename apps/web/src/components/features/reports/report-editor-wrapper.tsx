'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { ReportEditor } from './report-editor';

interface ReportEditorWrapperProps {
  params: { id: Id<'reports'> };
}

function ReportEditorSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-9 w-24' />
          <div>
            <Skeleton className='h-9 w-32 mb-2' />
            <Skeleton className='h-5 w-48' />
          </div>
        </div>
      </div>
      <div className='space-y-6'>
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-48 w-full' />
        <div className='flex justify-end gap-3'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-28' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>
    </div>
  );
}

export function ReportEditorWrapper({ params }: ReportEditorWrapperProps) {
  const reportData = useQuery(api.index.getReportForEdit, { reportId: params.id });

  if (reportData === undefined) {
    return <ReportEditorSkeleton />;
  }

  if (reportData === null) {
    return <div>日報が見つかりません。</div>;
  }

  return (
    <ReportEditor
      reportId={params.id}
      initialData={{
        ...reportData,
        reportDate: new Date(reportData.reportDate),
      }}
      expectedUpdatedAt={reportData.updated_at}
    />
  );
}

export default ReportEditorWrapper;
