import path from 'path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    'date-fns',
    'react-day-picker',
    'tailwindcss',
    'lucide-react',
    'react-hook-form',
    'browser-image-compression',
    'next-themes',
    'next/link',
    // Convex関連を除外
    'convex/react',
    'convex/server',
  ],
  esbuildOptions(options) {
    options.platform = 'neutral';
    // パスエイリアスの解決を追加
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    };
  },
  onSuccess: async () => {
    console.log('Build completed successfully');
  },
});
