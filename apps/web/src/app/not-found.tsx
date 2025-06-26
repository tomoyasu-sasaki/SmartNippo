import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_CONSTANTS } from '@/constants/common';
import { FileSearch, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex items-center justify-center min-h-screen p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='relative'>
              <FileSearch className='h-16 w-16 text-muted-foreground' />
              <span className='absolute -top-2 -right-2 text-4xl font-bold text-muted-foreground'>
                404
              </span>
            </div>
          </div>
          <CardTitle className='text-2xl'>{COMMON_CONSTANTS.NOT_FOUND_TITLE}</CardTitle>
          <CardDescription>{COMMON_CONSTANTS.NOT_FOUND_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='text-center text-sm text-muted-foreground'>
              <p>{COMMON_CONSTANTS.NOT_FOUND_GUIDE}</p>
            </div>
            <div className='grid gap-2'>
              <Link href='/'>
                <Button className='w-full' variant='default'>
                  <Home className='h-4 w-4 mr-2' />
                  {COMMON_CONSTANTS.HOME_BUTTON}
                </Button>
              </Link>
              <Link href='/dashboard'>
                <Button className='w-full' variant='outline'>
                  {COMMON_CONSTANTS.DASHBOARD_BUTTON}
                </Button>
              </Link>
              <Link href='/reports'>
                <Button className='w-full' variant='outline'>
                  {COMMON_CONSTANTS.REPORTS_BUTTON}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
