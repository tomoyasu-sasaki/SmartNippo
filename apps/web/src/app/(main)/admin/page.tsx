import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileStack, Users, Workflow } from 'lucide-react';
import Link from 'next/link';

const managementItems = [
  {
    href: '/admin/projects',
    title: 'プロジェクト管理',
    description: 'プロジェクトの作成、編集、削除を行います。',
    icon: <FileStack className='h-8 w-8' />,
  },
  {
    href: '/admin/approval-flows',
    title: '承認フロー管理',
    description: 'プロジェクトごとの承認フローを設定します。',
    icon: <Workflow className='h-8 w-8' />,
  },
  {
    href: '/admin/users',
    title: 'ユーザー権限管理',
    description: 'ユーザーの役割（管理者、マネージャー）を設定します。',
    icon: <Users className='h-8 w-8' />,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className='container mx-auto py-10'>
      <h1 className='text-3xl font-bold mb-8'>管理ダッシュボード</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {managementItems.map((item) => (
          <Link href={item.href} key={item.href} className='block h-full'>
            <Card className='hover:shadow-lg transition-shadow duration-300 h-full flex flex-col'>
              <CardHeader className='flex flex-row items-center gap-4 space-y-0 pb-2'>
                <div className='bg-primary/10 p-3 rounded-full'>{item.icon}</div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-sm text-muted-foreground'>{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
