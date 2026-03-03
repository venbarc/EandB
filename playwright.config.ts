import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * MediFlow Eligibility & Benefits Dashboard – Playwright Configuration
 *
 * Set APP_URL in your .env or shell to override the default base URL.
 * Set TEST_EMAIL / TEST_PASSWORD to use specific credentials for the
 * authenticated session created by e2e/auth.setup.ts.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authStoragePath = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  testDir: './e2e/tests',

  /* Run tests sequentially – we share a single Laravel/SQLite database */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker so tests don't race against each other on a shared DB */
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'e2e/report', open: 'never' }],
    ['line'],
  ],

  use: {
    /* Base URL – override with APP_URL env var */
    baseURL: process.env.APP_URL ?? 'http://localhost:8000',

    /* Collect trace on first retry so you can inspect failures */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on first retry */
    video: 'on-first-retry',

    /* Viewport */
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    /**
     * AUTH SETUP
     * Runs auth.setup.ts once before any authenticated test.
     * Saves browser cookies/session to e2e/.auth/user.json.
     */
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * UNAUTHENTICATED TESTS  (login page, register, forgot-password)
     * Run without any saved auth state.
     */
    {
      name: 'auth-flows',
      testMatch: /tests\/auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * AUTHENTICATED TESTS – Desktop Chrome
     * Depend on the setup project and reuse the saved session.
     */
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStoragePath,
      },
      dependencies: ['setup'],
    },

    /**
     * AUTHENTICATED TESTS – Firefox
     */
    {
      name: 'firefox',
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: authStoragePath,
      },
      dependencies: ['setup'],
    },

    /**
     * AUTHENTICATED TESTS – WebKit (Safari)
     */
    {
      name: 'webkit',
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        storageState: authStoragePath,
      },
      dependencies: ['setup'],
    },
  ],
});
