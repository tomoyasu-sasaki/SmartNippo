import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
    entry: './src/index.ts',
  },
  clean: true,
  sourcemap: true,
  treeshake: false,
  splitting: false,
  minify: false,
  tsconfig: './tsconfig.json',
  external: ['react', 'react-dom', 'zod'],
  esbuildOptions(options) {
    options.platform = 'neutral';
  },
});
