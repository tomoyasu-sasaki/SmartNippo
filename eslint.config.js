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
  // Mobile app specific rules
  {
    files: ['apps/mobile/**/*.ts', 'apps/mobile/**/*.tsx'],
    rules: {
      // strictNullChecks が false の場合、prefer-nullish-coalescing を無効化
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // React Native特有のany使用を許可する場面でwarningレベルに下げる
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
