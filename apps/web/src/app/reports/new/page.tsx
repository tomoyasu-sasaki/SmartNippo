import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ReportEditor } from '../report-editor';

export const metadata: Metadata = {
  title: '日報作成 | SmartNippo',
  description: '新しい日報を作成',
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
