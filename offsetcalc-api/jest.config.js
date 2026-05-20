/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  coverageThreshold: { global: { lines: 70 } },
};
