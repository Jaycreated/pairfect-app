module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind
      'nativewind/babel',
      // Required for reanimated
      'react-native-reanimated/plugin',
    ],
  };
};
