module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  globalSetup: '<rootDir>/tests/setupDb.js',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  clearMocks: true,
};