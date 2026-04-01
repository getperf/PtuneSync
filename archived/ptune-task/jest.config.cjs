/** @type {import('jest').Config} */

module.exports = {
  preset: "ts-jest",

  testEnvironment: "node",

  testMatch: [
    "**/__tests__/**/*.test.ts"
  ],

  moduleNameMapper: {
    "^obsidian$": "<rootDir>/tests/mocks/obsidian.ts"
  }

};