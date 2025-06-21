import { ConvexClientProvider } from '@/components/convex-provider';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartNippo - Daily Report Management',
  description: 'Modern daily report management app with AI assistance',
  keywords: ['daily report', 'team management', 'AI assistant'],
  authors: [{ name: 'SmartNippo Team' }],
  creator: 'SmartNippo Team',
  publisher: 'SmartNippo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <body className='min-h-screen bg-background font-sans antialiased'>
        <ConvexClientProvider>
          <div className='relative flex min-h-screen flex-col'>
            <div className='flex-1'>{children}</div>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
