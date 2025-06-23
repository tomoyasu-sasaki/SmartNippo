module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        jsxImportSource: 'nativewind',
        // Enable React 19 features
        jsxRuntime: 'automatic'
      }],
      'nativewind/babel'
    ],
    plugins: [
      // Ensure react-native-reanimated/plugin is last
      'react-native-reanimated/plugin'
    ]
  };
};
