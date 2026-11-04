import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['apps/api/test/**/*.test.ts', 'packages/shared/test/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 120000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      WEB_URL: 'http://localhost:3000',
      JWT_SECRET: 'test-only-nexora-secret-at-least-thirty-two-characters',
      MONGOMS_VERSION: '8.0.17',
      MONGOMS_MD5_CHECK: 'true',
    },
  },
});
