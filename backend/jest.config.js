module.exports = {
    // Test environment
    testEnvironment: 'node',
  
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
  
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,
  
    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',
  
    // An array of file extensions your modules use
    moduleFileExtensions: ['js', 'json'],
  
    // The test environment that will be used for testing
    testEnvironment: 'node',
  
    // The glob patterns Jest uses to detect test files
    testMatch: [
      '**/tests/**/*.test.js',
      '**/__tests__/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
  
    // An array of regexp pattern strings that are matched against all test paths
    testPathIgnorePatterns: [
      '/node_modules/',
      '/build/',
      '/dist/'
    ],
  
    // Coverage collection configuration
    collectCoverageFrom: [
      'models/**/*.js',
      'routes/**/*.js',
      'middleware/**/*.js',
      'services/**/*.js',
      'utils/**/*.js',
      'controllers/**/*.js',
      '!**/node_modules/**',
      '!**/tests/**',
      '!**/coverage/**',
      '!server.js',
      '!app.js'
    ],
  
    // Coverage thresholds
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    },
  
    // Coverage reporters
    coverageReporters: [
      'text',
      'lcov',
      'html',
      'json-summary'
    ],
  
    // Setup files to run before tests
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
    // Test timeout
    testTimeout: 10000,
  
    // Verbose output
    verbose: true,
  
    // Force exit after tests complete
    forceExit: true,
  
    // Detect open handles
    detectOpenHandles: true,
  
    // Transform configuration
    transform: {},
  
    // Module name mapping for absolute imports
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
      '^@models/(.*)$': '<rootDir>/models/$1',
      '^@routes/(.*)$': '<rootDir>/routes/$1',
      '^@middleware/(.*)$': '<rootDir>/middleware/$1',
      '^@services/(.*)$': '<rootDir>/services/$1',
      '^@utils/(.*)$': '<rootDir>/utils/$1',
      '^@config/(.*)$': '<rootDir>/config/$1'
    },
  
    // Global variables available in tests
    globals: {
      NODE_ENV: 'test'
    },
  
    // Setup and teardown
    globalSetup: '<rootDir>/tests/globalSetup.js',
    globalTeardown: '<rootDir>/tests/globalTeardown.js',
  
    // Ignore patterns for watch mode
    watchPathIgnorePatterns: [
      '/node_modules/',
      '/coverage/',
      '/logs/',
      '/uploads/'
    ],
  
    // Error on deprecated features
    errorOnDeprecated: true,
  
    // Fail tests on console.error
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
    // Reporters
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: 'coverage',
        outputName: 'junit.xml'
      }]
    ],
  
    // Max workers for parallel test execution
    maxWorkers: '50%',
  
    // Automatically restore mock state between every test
    restoreMocks: true,
  
    // Run tests serially
    runInBand: false,
  
    // Silent mode (suppress console.log in tests)
    silent: false,
  
    // Indicate whether each individual test should be reported during the run
    verbose: true,
  
    // Automatically reset mock state between every test
    resetMocks: true
  };