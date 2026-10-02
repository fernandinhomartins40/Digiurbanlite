/** Testes do servidor do bot (jest + ts-jest). Unitários: sem banco nem rede. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { diagnostics: false, isolatedModules: true }],
  },
  testTimeout: 20000,
};
