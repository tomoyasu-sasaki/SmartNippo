'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { ReactNode } from 'react';

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
