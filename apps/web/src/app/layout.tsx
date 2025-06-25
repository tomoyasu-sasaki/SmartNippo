import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Navigation } from '@/components/navigation';
import { Toaster } from '@/components/ui/sonner';
import ConvexClientProvider from '@/providers/convex-client-provider';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import './globals.css';

const inter = Inter({ subsets: ['greek'] });

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
    <ClerkProvider>
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
                <Navigation />
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
