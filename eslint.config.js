import configEslint from './packages/config/eslint/index.js';

export default [
  ...configEslint,
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      '**/dist/**',
      'build/**',
      '**/build/**',
      '.turbo/**',
      '**/.turbo/**',
      'coverage/**',
      '**/coverage/**',
      '.next/**',
      '**/.next/**',
      '.expo/**',
      '**/.expo/**',
      'android/**',
      'ios/**',
      'convex/_generated/**',
      '**/convex/_generated/**',
    ],
  },
];
