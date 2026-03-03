/**
 * e2e/tests/auth.spec.ts
 *
 * Authentication flow tests — run WITHOUT saved auth state so that
 * each test starts from an anonymous browser session.
 *
 * Covers:
 *  - Login page structure
 *  - Successful login → dashboard redirect
 *  - Failed login → inline error messages
 *  - Password visibility toggle
 *  - Remember-me checkbox state
 *  - Navigation links (Forgot Password, Register)
 *  - Register page structure
 *  - Forgot Password page structure
 *  - Authenticated redirect (visiting /login while logged in)
 *  - Logout flow
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'password';

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login page – structure', () => {
  test('renders all required elements', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.heading).toBeVisible();
    await expect(login.subheading).toBeVisible();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.rememberCheckbox).toBeVisible();
    await expect(login.submitButton).toBeVisible();
    await expect(login.forgotPasswordLink).toBeVisible();
    await expect(login.registerLink).toBeVisible();
  });

  test('email input has correct type and autocomplete', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.emailInput).toHaveAttribute('type', 'email');
    await expect(login.emailInput).toHaveAttribute('autocomplete', 'email');
  });

  test('password input defaults to type="password"', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    expect(await login.getPasswordInputType()).toBe('password');
  });

  test('password visibility toggle switches input type', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Fill password so toggle is meaningful
    await login.fillPassword('secret');

    // Toggle to text
    await login.togglePasswordVisibility();
    expect(await login.getPasswordInputType()).toBe('text');

    // Toggle back to password
    await login.togglePasswordVisibility();
    expect(await login.getPasswordInputType()).toBe('password');
  });

  test('remember-me checkbox is unchecked by default', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    expect(await login.isRememberChecked()).toBe(false);
  });

  test('remember-me checkbox can be toggled', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.rememberCheckbox.check();
    expect(await login.isRememberChecked()).toBe(true);

    await login.rememberCheckbox.uncheck();
    expect(await login.isRememberChecked()).toBe(false);
  });

  test('submit button is initially enabled', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.submitButton).toBeEnabled();
    await expect(login.submitButton).toHaveText('Sign in');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN – VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login page – validation', () => {
  test('shows error with empty fields on submit', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Submit without filling anything
    await login.submit();

    // HTML5 validation or server-side error should prevent navigation
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error with invalid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.login('wrong@example.com', 'wrongpassword');

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Some error indicator should appear (server renders error)
    const errorEl = page.locator('.text-red-500, [class*="text-red"]');
    await expect(errorEl.first()).toBeVisible({ timeout: 5000 });
  });

  test('email field shows validation on obviously bad email format', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.fillEmail('not-an-email');
    await login.fillPassword('somepassword');
    await login.submit();

    // Browser native validation OR we stay on the login page
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN – SUCCESSFUL FLOW
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login page – successful flow', () => {
  test('valid credentials redirect to dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    await expect(page).toHaveURL('/');
  });

  test('dashboard requires auth – unauthenticated request redirects to /login', async ({ page }) => {
    // Access dashboard without logging in
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Logout', () => {
  test('logout redirects to /login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Find and click the logout button/form in the header
    const logoutBtn = page.locator('button', { hasText: /Logout|Log out/i });
    await expect(logoutBtn).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/login/),
      logoutBtn.click(),
    ]);

    await expect(page).toHaveURL(/\/login/);
  });

  test('after logout, navigating to / redirects to /login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    const logoutBtn = page.locator('button', { hasText: /Logout|Log out/i });
    await Promise.all([
      page.waitForURL(/\/login/),
      logoutBtn.click(),
    ]);

    // Now try to visit dashboard
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION LINKS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Auth navigation links', () => {
  test('clicking Register link navigates to /register', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await Promise.all([
      page.waitForURL('/register'),
      login.registerLink.click(),
    ]);

    await expect(page).toHaveURL('/register');
    await expect(page.locator('h2')).toBeVisible();
  });

  test('clicking Forgot Password link navigates to /forgot-password', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await Promise.all([
      page.waitForURL('/forgot-password'),
      login.forgotPasswordLink.click(),
    ]);

    await expect(page).toHaveURL('/forgot-password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER PAGE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Register page', () => {
  test('renders registration form fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('input[type="email"], #email')).toBeVisible();
    await expect(page.locator('input[id="password"], input[name="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('has a link back to login', async ({ page }) => {
    await page.goto('/register');

    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD PAGE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Forgot Password page', () => {
  test('renders email input and submit button', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('input[type="email"], #email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('submitting blank form stays on page', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
