import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'e2e',
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    // Uncomment these for visual debugging
    //headless: false,
    //slowMo: 1000,
  },
  // For CI environments, run headless. For local development, you can override
  pprojects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});