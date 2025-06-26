import ReportEditorWrapper from '@/components/features/reports/report-editor-wrapper';
import { REPORTS_CONSTANTS } from '@/constants/reports';
import { auth } from '@clerk/nextjs/server';
import type { Id } from 'convex/_generated/dataModel';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: REPORTS_CONSTANTS.META_EDIT_TITLE,
  description: REPORTS_CONSTANTS.META_EDIT_DESCRIPTION,
};

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const resolvedParams = await params;
  if (!resolvedParams || typeof resolvedParams.id !== 'string') {
    redirect('/not-found');
  }

  const reportId = resolvedParams.id as Id<'reports'>;

  return (
    <div className='h-full max-w-4xl mx-auto'>
      <ReportEditorWrapper params={{ id: reportId }} />
    </div>
  );
}
