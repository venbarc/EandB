import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for /login
 */
export class LoginPage {
  readonly page: Page;

  // ── Form fields ────────────────────────────────────────────────────────
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberCheckbox: Locator;

  // ── Buttons & Links ────────────────────────────────────────────────────
  readonly submitButton: Locator;
  readonly passwordToggleButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  // ── Validation messages ────────────────────────────────────────────────
  readonly emailError: Locator;
  readonly passwordError: Locator;

  // ── Status banner (e.g. "Password reset successful") ──────────────────
  readonly statusBanner: Locator;

  // ── Layout text ───────────────────────────────────────────────────────
  readonly heading: Locator;
  readonly subheading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput          = page.locator('#email');
    this.passwordInput       = page.locator('#password');
    this.rememberCheckbox    = page.locator('input[type="checkbox"]');
    this.submitButton        = page.locator('button[type="submit"]');
    this.passwordToggleButton = page.locator('button[tabindex="-1"]');
    this.forgotPasswordLink  = page.locator('a[href="/forgot-password"]');
    this.registerLink        = page.locator('a[href="/register"]');
    this.emailError          = page.locator('#email ~ p.text-red-500, #email + p.text-red-500');
    this.passwordError       = page.locator('#password').locator('..').locator('~ p.text-red-500');
    this.statusBanner        = page.locator('.bg-emerald-50');
    this.heading             = page.locator('h2', { hasText: 'Welcome back' });
    this.subheading          = page.locator('p', { hasText: 'Sign in to continue' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await Promise.all([
      this.page.waitForURL('/'),
      this.submit(),
    ]);
  }

  async togglePasswordVisibility() {
    await this.passwordToggleButton.click();
  }

  async getPasswordInputType(): Promise<string | null> {
    return this.passwordInput.getAttribute('type');
  }

  async isRememberChecked(): Promise<boolean> {
    return this.rememberCheckbox.isChecked();
  }
}
