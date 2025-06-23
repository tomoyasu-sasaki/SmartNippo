import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
    // Build .d.ts files only
    only: false,
    // Enable experimental dts generation
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  tsconfig: './tsconfig.json',
  external: ['zod'],
  esbuildOptions(options) {
    options.platform = 'neutral';
  },
});
