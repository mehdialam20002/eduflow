import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// The three workspaces must stay separable, so a leak is caught by lint and not by a
// production incident: client/ never reaches into server/, server/ never renders React,
// and shared/ stays small enough to run on both sides.
// '@eduflow/shared/testing' is the one published subpath: it holds the test harness, which the
// application code must never import, so it stays out of the main entry point on purpose.
const onlyPublicShared = {
  group: ['@eduflow/shared/*', '!@eduflow/shared/testing', '**/shared/src/**'],
  message: 'Import from "@eduflow/shared" only. Deep imports break the public door.',
};

const clientBoundaries = [
  onlyPublicShared,
  {
    group: ['**/server/src/**', '@prisma/client', 'express', 'bullmq', 'ioredis', 'pino'],
    message: 'The client never imports server code. Call the API over /api/v1 instead.',
  },
];

const serverBoundaries = [
  onlyPublicShared,
  {
    group: ['**/client/src/**', 'react', 'react-dom', 'next', 'next/*'],
    message: 'The server never imports client code.',
  },
];

const sharedBoundaries = [
  {
    group: ['**/client/src/**', '**/server/src/**', 'react', 'next', 'express', '@prisma/client'],
    message: 'shared/ depends on zod only, because both sides compile it.',
  },
];

// Node globals, written out so the repo does not need the "globals" package for
// a handful of plain .mjs helper scripts.
const nodeGlobals = {
  Buffer: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  TextDecoder: 'readonly',
  TextEncoder: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  process: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  structuredClone: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.tsbuildinfo',
      'docs/**',
      'client/src/components/ui/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: clientBoundaries }],
    },
  },
  {
    files: ['server/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: serverBoundaries }],
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Import env from config/env.ts.' },
      ],
    },
  },
  {
    // Controllers, routes and jobs orchestrate. Only repositories and services may
    // hold a Prisma client, so a tenant filter is never forgotten in a hot path.
    files: [
      'server/src/modules/**/*.{controller,routes,schemas,events}.ts',
      'server/src/middleware/**/*.ts',
      'server/src/jobs/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...serverBoundaries,
            {
              group: ['**/lib/prisma', '@prisma/client'],
              message: 'Prisma belongs in repository and service files only.',
            },
          ],
        },
      ],
    },
  },
  {
    // Generated from the specifications, so size limits and style rules do not apply.
    files: ['shared/src/generated/**/*.ts'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
  {
    files: ['server/src/config/env.ts', 'server/src/lib/prisma.ts'],
    rules: { 'no-restricted-properties': 'off', 'no-restricted-imports': 'off' },
  },
  {
    // The error handler turns Prisma's own error classes into canon error codes, so it is the
    // one piece of middleware that must see them. Test bootstraps set environment variables
    // before config/env.ts is imported, which is the only way to do it.
    files: ['server/src/middleware/error-handler.ts', 'server/src/test/**/*.ts', '**/*.test.ts'],
    rules: { 'no-restricted-properties': 'off', 'no-restricted-imports': 'off' },
  },
  {
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: sharedBoundaries }],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/tests/**/*.{ts,tsx}', '**/*.config.{ts,mts,mjs}'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
  {
    // The repo scripts are command-line tools: their terminal output is the product.
    files: ['scripts/**/*.mjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: { 'no-console': 'off' },
  },
  eslintConfigPrettier,
);
