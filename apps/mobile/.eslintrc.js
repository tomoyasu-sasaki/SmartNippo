module.exports = {
  extends: ['../../eslint.config.js'],
  rules: {
    // strictNullChecks が false の場合、prefer-nullish-coalescing を無効化
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    // React Native特有のany使用を許可する場面でwarningレベルに下げる
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: ['**/*.tsx', '**/*.ts'],
      rules: {
        // FormData など React Native 固有の型問題に対応
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
};
