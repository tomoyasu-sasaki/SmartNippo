'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LAYOUT_CONSTANTS } from '@smartnippo/lib';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>{LAYOUT_CONSTANTS.TOGGLE_THEME_SR}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='bg-[var(--background)]'>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          {LAYOUT_CONSTANTS.THEME.LIGHT}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          {LAYOUT_CONSTANTS.THEME.DARK}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          {LAYOUT_CONSTANTS.THEME.SYSTEM}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
