module.exports = {
  watchman: false,
  forceExit: true,
  testTimeout: 30000,
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/jest/react-native-mock.js',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '__tests__/App.test.tsx',
  ],
};
