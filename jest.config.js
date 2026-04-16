const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  // Only match *.test.* and *.spec.* files — prevents fixture/helper files
  // in __tests__/ from being picked up as test suites.
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  // Explicit alias so jest.mock('@/...') resolves correctly alongside next/jest's
  // async config resolution.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
})
