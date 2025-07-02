'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { BarChart3, FileText, Home, Menu, Package2, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LAYOUT_CONSTANTS } from '@smartnippo/lib';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const pathname = usePathname();
  const userProfile = useQuery(api.index.current);

  return (
    <header className='sticky top-0 z-50 flex h-16 items-center gap-2 border-b bg-[var(--background)] px-2 md:px-6'>
      <div className='flex items-center gap-2 md:gap-6'>
        <Link
          href='/dashboard'
          className='flex items-center gap-2 text-lg font-semibold md:text-base'
        >
          <Package2 className='h-6 w-6' />
          <span className='hidden sm:inline-block'>{LAYOUT_CONSTANTS.APP_NAME}</span>
        </Link>
        <NavigationMenu className='hidden md:flex items-center bg-[var(--background)]'>
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
                  {LAYOUT_CONSTANTS.NAV_LINKS.DASHBOARD}
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
                  {LAYOUT_CONSTANTS.NAV_LINKS.REPORTS}
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
                  {LAYOUT_CONSTANTS.NAV_LINKS.PROFILE}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            {userProfile?.role === 'admin' && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href='/admin'
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname.startsWith('/admin') && 'bg-accent'
                    )}
                  >
                    <Package2 className='mr-2 h-4 w-4' />
                    {LAYOUT_CONSTANTS.NAV_LINKS.ADMIN}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href='/analytics'
                  className={cn(
                    navigationMenuTriggerStyle(),
                    pathname === '/analytics' && 'bg-accent',
                    'cursor-not-allowed opacity-50'
                  )}
                  onClick={(e: React.MouseEvent) => e.preventDefault()}
                >
                  <BarChart3 className='mr-2 h-4 w-4' />
                  {LAYOUT_CONSTANTS.NAV_LINKS.ANALYTICS}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
            <Menu className='h-5 w-5' />
            <span className='sr-only'>{LAYOUT_CONSTANTS.TOGGLE_NAVIGATION_MENU_SR}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='bg-[var(--background)]'>
          <SheetHeader>
            <SheetTitle className='sr-only'>Navigation Menu</SheetTitle>
          </SheetHeader>
          <nav className='grid gap-6 text-lg font-medium'>
            <Link href='#' className='flex items-center gap-2 text-lg font-semibold'>
              <Package2 className='h-6 w-6' />
              <span className='sr-only'>{LAYOUT_CONSTANTS.APP_NAME}</span>
            </Link>
            <Link
              href='/dashboard'
              className={cn(
                'hover:text-foreground',
                pathname === '/dashboard' && 'text-foreground'
              )}
            >
              {LAYOUT_CONSTANTS.NAV_LINKS.DASHBOARD}
            </Link>
            <Link
              href='/reports'
              className={cn(
                'text-muted-foreground hover:text-foreground',
                pathname.startsWith('/reports') && 'text-foreground'
              )}
            >
              {LAYOUT_CONSTANTS.NAV_LINKS.REPORTS}
            </Link>
            <Link
              href='/profile'
              className={cn(
                'text-muted-foreground hover:text-foreground',
                pathname === '/profile' && 'text-foreground'
              )}
            >
              {LAYOUT_CONSTANTS.NAV_LINKS.PROFILE}
            </Link>
            {userProfile?.role === 'admin' && (
              <Link
                href='/admin'
                className={cn(
                  'text-muted-foreground hover:text-foreground',
                  pathname.startsWith('/admin') && 'text-foreground'
                )}
              >
                {LAYOUT_CONSTANTS.NAV_LINKS.ADMIN}
              </Link>
            )}
            <Link
              href='/analytics'
              className='cursor-not-allowed text-muted-foreground opacity-50'
              onClick={(e: React.MouseEvent) => e.preventDefault()}
            >
              {LAYOUT_CONSTANTS.NAV_LINKS.ANALYTICS}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <div className='flex w-full items-center justify-end gap-2 md:ml-auto md:gap-2 lg:gap-4'>
        <ThemeToggle />
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl='/dashboard'
          afterSelectOrganizationUrl='/dashboard'
          afterLeaveOrganizationUrl='/dashboard'
        />
        <UserButton afterSignOutUrl='/login' signInUrl='/login' />
      </div>
    </header>
  );
}
