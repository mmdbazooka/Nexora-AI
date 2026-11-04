import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import ts from 'typescript-eslint';
export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
  ...next.map((c) => ({ ...c, files: ['apps/web/**/*.{ts,tsx}'] })),
  ...nextTs.map((c) => ({ ...c, files: ['apps/web/**/*.{ts,tsx}'] })),
  ...ts.configs.recommended.map((c) => ({
    ...c,
    files: ['apps/api/**/*.ts', 'packages/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': ts.plugin },
    settings: { next: { rootDir: 'apps/web/' } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
