/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile packages from the monorepo
  transpilePackages: [
    '@smartnippo/ui',
    '@smartnippo/lib',
    '@smartnippo/types',
    '@smartnippo/config',
  ],

  // Environment variables for client-side usage
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },

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

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Performance optimizations
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // Generate service worker for PWA features
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
