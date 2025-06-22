import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile packages from the monorepo
  transpilePackages: [
    '@smartnippo/ui',
    '@smartnippo/lib',
    '@smartnippo/types',
    '@smartnippo/config',
  ],

  // Experimental features
  experimental: {
    // Optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.convex.cloud',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // TypeScript configuration
  typescript: {
    // Type checking performed in separate process
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // ESLint performed in separate process
    ignoreDuringBuilds: false,
  },

  // Performance optimizations
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // Logging configuration for development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
