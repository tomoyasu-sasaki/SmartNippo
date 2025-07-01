import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ERROR_PAGE_CONSTANTS } from '@smartnippo/lib';
import { FileSearch } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='relative'>
              <FileSearch className='h-16 w-16 text-muted-foreground' />
              {/* <span className='absolute -top-2 -right-2 text-4xl font-bold text-muted-foreground'>
                404
              </span> */}
            </div>
          </div>
          <CardTitle className='text-2xl'>{ERROR_PAGE_CONSTANTS.NOT_FOUND_TITLE}</CardTitle>
          <CardDescription>{ERROR_PAGE_CONSTANTS.NOT_FOUND_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-600 text-center'>
            {ERROR_PAGE_CONSTANTS.NOT_FOUND_GUIDE}
          </p>
          <div className='space-y-2'>
            <Link href='/' className='block'>
              <Button className='w-full'>{ERROR_PAGE_CONSTANTS.HOME_BUTTON}</Button>
            </Link>
            <Link href='/dashboard' className='block'>
              <Button variant='outline' className='w-full'>
                {ERROR_PAGE_CONSTANTS.DASHBOARD_BUTTON}
              </Button>
            </Link>
            <Link href='/reports' className='block'>
              <Button variant='outline' className='w-full'>
                {ERROR_PAGE_CONSTANTS.REPORTS_BUTTON}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
