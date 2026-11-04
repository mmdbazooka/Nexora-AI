import { defineConfig, devices } from '@playwright/test';
const full = process.env.E2E_FULL_STACK === '1';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: full ? 'workspace.spec.ts' : 'public.spec.ts',
  fullyParallel: !full,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: full
    ? [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
      ],
  webServer: [
    {
      command: 'npm start -w @nexora/web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    ...(full
      ? [
          {
            command: 'npm run dev -w @nexora/api',
            url: 'http://127.0.0.1:4000/health',
            reuseExistingServer: !process.env.CI,
            timeout: 30000,
          },
        ]
      : []),
  ],
});
