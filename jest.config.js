export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/verification/tests/mocks/false-reporting-scenarios.test.ts',
    '<rootDir>/src/providers/external-cli-provider.test.ts',
    '<rootDir>/src/cli/__tests__/**/*.test.js',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/bin/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'es2022',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        target: 'es2022'
      }
    }],
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { modules: false }]]
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/bin/',
    '<rootDir>/node_modules/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer|nanoid|fs-extra|ansi-styles|ruv-swarm|@modelcontextprotocol)/)'
  ],
  resolver: undefined,
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.js',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.js',
    '!src/**/*.spec.ts',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
  // Enhanced error handling
  errorOnDeprecated: false,
  // Better module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  // Remove deprecated globals configuration
  // ts-jest configuration moved to transform options above
};