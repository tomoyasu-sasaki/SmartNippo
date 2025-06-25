'use client';

import { CircleUser, Menu, Package2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  return (
    <header className='sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6'>
      <nav className='hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6'>
        <a href='#' className='flex items-center gap-2 text-lg font-semibold md:text-base'>
          <Package2 className='h-6 w-6' />
          <span className='sr-only'>SmartNippo</span>
        </a>
        <a href='#' className='text-foreground transition-colors hover:text-foreground'>
          ダッシュボード
        </a>
        <a href='#' className='text-muted-foreground transition-colors hover:text-foreground'>
          日報一覧
        </a>
        <a href='#' className='text-muted-foreground transition-colors hover:text-foreground'>
          設定
        </a>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
            <Menu className='h-5 w-5' />
            <span className='sr-only'>Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left'>
          <nav className='grid gap-6 text-lg font-medium'>
            <a href='#' className='flex items-center gap-2 text-lg font-semibold'>
              <Package2 className='h-6 w-6' />
              <span className='sr-only'>SmartNippo</span>
            </a>
            <a href='#' className='hover:text-foreground'>
              ダッシュボード
            </a>
            <a href='#' className='text-muted-foreground hover:text-foreground'>
              日報一覧
            </a>
            <a href='#' className='text-muted-foreground hover:text-foreground'>
              設定
            </a>
          </nav>
        </SheetContent>
      </Sheet>
      <div className='flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4'>
        <div className='ml-auto flex-1 sm:flex-initial'>{/*将来的に検索バーなどを配置*/}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='secondary' size='icon' className='rounded-full'>
              <CircleUser className='h-5 w-5' />
              <span className='sr-only'>Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>プロフィール</DropdownMenuItem>
            <DropdownMenuItem>設定</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>ログアウト</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
