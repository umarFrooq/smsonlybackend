module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  restoreMocks: true,
  coveragePathIgnorePatterns: ['node_modules', 'config', 'server.js', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
