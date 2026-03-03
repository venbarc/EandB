/**
 * e2e/auth.setup.ts
 *
 * One-time setup that runs before any authenticated test project.
 * Logs in with the credentials supplied via env vars (or defaults)
 * and saves the resulting browser storage state to disk so that
 * every subsequent test can reuse the session without re-logging-in.
 *
 * Usage:
 *   TEST_EMAIL=admin@example.com TEST_PASSWORD=secret npx playwright test
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

setup('authenticate and save session', async ({ page }) => {
  // Ensure the .auth directory exists
  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const email    = process.env.TEST_EMAIL    ?? 'test@example.com';
  const password = process.env.TEST_PASSWORD ?? 'password';

  // ── Navigate to login page ──────────────────────────────────────────────
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('h2', { hasText: 'Welcome back' })).toBeVisible();

  // ── Fill credentials ────────────────────────────────────────────────────
  await page.fill('#email', email);
  await page.fill('#password', password);

  // ── Submit and wait for redirect to dashboard ───────────────────────────
  await Promise.all([
    page.waitForURL('/'),
    page.click('button[type="submit"]'),
  ]);

  // ── Verify we are on the dashboard ──────────────────────────────────────
  await expect(page).toHaveURL('/');

  // ── Persist the session ──────────────────────────────────────────────────
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`\n✔ Auth state saved to ${AUTH_FILE}`);
});
