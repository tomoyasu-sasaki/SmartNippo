// ========================================
// Next.js specific types
// ========================================

// Next.js page props
export interface NextPageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

// Next.js error page props
export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Server component props
export interface ServerComponentProps {
  children?: React.ReactNode;
}

// Layout props specific to web
export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Static params for dynamic routes
export interface StaticParams {
  id: string;
}

// Static props for SSG
export interface StaticProps<T = {}> {
  props: T;
  revalidate?: number | false;
}
