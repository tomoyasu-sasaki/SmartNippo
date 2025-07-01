import { ReportEditor } from '@/components/features/reports/report-editor';
import { auth } from '@clerk/nextjs/server';
import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: REPORTS_CONSTANTS.META_NEW_TITLE,
  description: REPORTS_CONSTANTS.META_NEW_DESCRIPTION,
};

export default async function NewReportPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return (
    <div className='h-full max-w-4xl mx-auto'>
      <ReportEditor />
    </div>
  );
}
