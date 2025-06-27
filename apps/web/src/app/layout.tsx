import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthSync } from '@/components/features/auth/auth-sync';
import { ConditionalNavigation } from '@/components/layouts/conditional-navigation';
import { Toaster } from '@/components/ui/sonner';
import ConvexClientProvider from '@/providers/convex-client-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartNippo',
  description: 'An intelligent daily report management app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl='/login'>
      <html lang='ja' suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <NuqsAdapter>
                <AuthSync />
                <ConditionalNavigation />
                <main className='container mx-auto px-4 py-6'>{children}</main>
                <Toaster />
              </NuqsAdapter>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
