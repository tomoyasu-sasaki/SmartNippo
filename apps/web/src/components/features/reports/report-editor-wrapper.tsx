'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import type { ReportEditorWrapperProps } from '@smartnippo/types';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { ReportEditor } from './report-editor';

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
        <div className='flex flex-col sm:flex-row sm:justify-end gap-3'>
          <Skeleton className='h-10 w-full sm:w-24' />
          <Skeleton className='h-10 w-full sm:w-28' />
          <Skeleton className='h-10 w-full sm:w-24' />
        </div>
      </div>
    </div>
  );
}

export function ReportEditorWrapper({ params }: ReportEditorWrapperProps) {
  const reportIdConv = params.id as Id<'reports'>;
  const reportData = useQuery(api.index.getReportForEdit, { reportId: reportIdConv });

  if (reportData === undefined) {
    return <ReportEditorSkeleton />;
  }

  if (reportData === null) {
    return <div>{REPORTS_CONSTANTS.NO_REPORTS_MESSAGE}</div>;
  }

  return (
    <ReportEditor
      reportId={reportIdConv}
      initialData={
        {
          ...reportData,
          reportDate: new Date(reportData.reportDate),
        } as any
      }
      expectedUpdatedAt={reportData.updated_at}
    />
  );
}

export default ReportEditorWrapper;
