/**
 * Testes do backend (jest + ts-jest). Antes não havia configuração: o jest
 * tentava ler TypeScript como JavaScript e NENHUM teste rodava.
 * Unitários não precisam de banco (prisma é simulado nos testes).
 */
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
