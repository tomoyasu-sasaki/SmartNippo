export default {
  // Basic formatting
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  // JSX/React formatting
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Trailing commas (ES5 for compatibility)
  trailingComma: 'es5',

  // Spacing
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Line endings (LF for cross-platform compatibility)
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Import organization plugin
  plugins: ['prettier-plugin-organize-imports'],

  // File-specific overrides
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        printWidth: 80,
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
