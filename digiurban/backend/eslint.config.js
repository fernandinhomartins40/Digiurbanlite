// ============================================================================
// FASE 3 - ESLINT v9 CONFIGURATION
// Configuração moderna do ESLint para TypeScript
// ============================================================================

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';

export default [
  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ['src/**/*.ts', 'src/**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'off',

      // Prettier integration
      'prettier/prettier': 'error',

      // General rules
      'no-console': 'off', // Allow console.log for logging
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version instead
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/',
      'node_modules/',
      'prisma/migrations/',
      '*.js.map',
      '*.min.js',
      'coverage/',
      '.env*',
    ],
  },
];