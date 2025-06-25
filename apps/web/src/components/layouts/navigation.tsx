'use client';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import { BarChart3, FileText, Home, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';

export function Navigation() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  // Don't show navigation on landing page
  if (!isSignedIn && pathname === '/') {
    return null;
  }

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background'>
      <div className='container flex h-16 items-center justify-between'>
        <div className='flex items-center gap-6'>
          <Link href={isSignedIn ? '/dashboard' : '/'} className='flex items-center gap-2'>
            <FileText className='h-6 w-6' />
            <span className='text-xl font-bold'>SmartNippo</span>
          </Link>

          <SignedIn>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/dashboard'
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname === '/dashboard' && 'bg-accent'
                      )}
                    >
                      <Home className='mr-2 h-4 w-4' />
                      ダッシュボード
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/reports'
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname.startsWith('/reports') && 'bg-accent'
                      )}
                    >
                      <FileText className='mr-2 h-4 w-4' />
                      日報
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/profile'
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname === '/profile' && 'bg-accent'
                      )}
                    >
                      <User className='mr-2 h-4 w-4' />
                      プロフィール
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/analytics'
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname === '/analytics' && 'bg-accent',
                        'opacity-50 cursor-not-allowed'
                      )}
                      onClick={(e: React.MouseEvent) => e.preventDefault()}
                    >
                      <BarChart3 className='mr-2 h-4 w-4' />
                      分析（準備中）
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </SignedIn>
        </div>

        <div className='flex items-center gap-4'>
          <SignedOut>
            <Link href='/'>
              <Button>ログイン</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <ThemeToggle />
            <UserButton
              afterSignOutUrl='/'
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
