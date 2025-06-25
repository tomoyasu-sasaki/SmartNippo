import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  clean: false,
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
