module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    "react-native-reanimated/plugin",
    ['dotenv-import', {
      "moduleName": "react-native-dotenv",
      "path": ".env"
    }],
  ]
};
