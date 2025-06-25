import * as React from 'react';

import { cn } from '../../lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback ?? DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className='flex min-h-[200px] flex-col items-center justify-center space-y-4 p-6 text-center'>
    <div className='space-y-2'>
      <h2 className='text-lg font-semibold text-destructive'>エラーが発生しました</h2>
      <p className='text-sm text-muted-foreground'>
        申し訳ございません。予期しないエラーが発生しました。
      </p>
      {error && (
        <details className='mt-4 text-left'>
          <summary className='cursor-pointer text-sm font-medium'>エラーの詳細</summary>
          <pre className='mt-2 whitespace-pre-wrap text-xs text-muted-foreground'>
            {error.message}
          </pre>
        </details>
      )}
    </div>
    <button
      onClick={resetError}
      className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary-hover focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring'
    >
      再試行
    </button>
  </div>
);

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ className, title = 'エラー', message, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center space-y-4 p-6 text-center',
        className
      )}
      {...props}
    >
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold text-destructive'>{title}</h3>
        {message && <p className='text-sm text-muted-foreground'>{message}</p>}
      </div>
      {action}
    </div>
  )
);
ErrorMessage.displayName = 'ErrorMessage';

export { DefaultErrorFallback, ErrorMessage };
