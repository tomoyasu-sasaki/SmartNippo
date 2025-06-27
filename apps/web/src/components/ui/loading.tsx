import type { LoadingOverlayProps, LoadingProps, LoadingSpinnerProps } from '@/types';
import * as React from 'react';

import { cn } from '../../lib/utils';

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
LoadingSpinner.displayName = 'LoadingSpinner';

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, text = '読み込み中...', size = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center space-y-2 p-4', className)}
      {...props}
    >
      <LoadingSpinner size={size} />
      {text && <p className='text-sm text-muted-foreground'>{text}</p>}
    </div>
  )
);
Loading.displayName = 'Loading';

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, isLoading, text = '読み込み中...', children, ...props }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {children}
      {isLoading && (
        <div className='absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
          <Loading text={text} />
        </div>
      )}
    </div>
  )
);
LoadingOverlay.displayName = 'LoadingOverlay';

export { Loading, LoadingOverlay, LoadingSpinner };
