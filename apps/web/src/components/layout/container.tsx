import { cn } from '@/lib/utils';
import React from 'react';

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8', className)}>
      {children}
    </div>
  );
}
