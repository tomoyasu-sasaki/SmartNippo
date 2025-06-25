import { ReportDetail } from '@/components/features/reports/report-detail';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '日報詳細 | SmartNippo',
  description: '日報の詳細を表示',
};

interface ReportDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect('/');
  }

  return (
    <div className='h-full max-w-5xl mx-auto'>
      <ReportDetail reportId={id as any} />
    </div>
  );
}
