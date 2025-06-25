'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { ReactNode } from 'react';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
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
