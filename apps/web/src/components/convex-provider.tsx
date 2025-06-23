'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import React, { useState } from 'react';

// Convex URL with fallback for build-time
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? 'https://rapid-tapir-749.convex.cloud';

const convex = new ConvexReactClient(convexUrl);

interface ConvexClientProviderProps {
  children: React.ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      })
  );

  // If no Convex URL is provided, render children without Convex
  if (!convexUrl || convexUrl === 'undefined') {
    return <QueryClientProvider client={queryClient}>{children as any}</QueryClientProvider>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convex}>{children as any}</ConvexProvider>
    </QueryClientProvider>
  );
}
