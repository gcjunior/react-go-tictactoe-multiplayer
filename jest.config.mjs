export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['./src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy', // ✅ Use identity-obj-proxy for CSS
  },
  testMatch: ['**/*.test.(ts|tsx)'],
};
