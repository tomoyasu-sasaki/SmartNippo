import { auth } from '@clerk/nextjs/server';
import type { Id } from 'convex/_generated/dataModel';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ReportEditorWrapper from './report-editor-wrapper';

export const metadata: Metadata = {
  title: '日報編集 | SmartNippo',
  description: '日報を編集',
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
