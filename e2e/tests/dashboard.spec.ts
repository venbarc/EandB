/**
 * e2e/tests/dashboard.spec.ts
 *
 * High-level dashboard integrity tests — verifies that all major
 * sections render correctly when arriving as an authenticated user.
 *
 * Covers:
 *  - Page title and URL
 *  - Header presence (brand, nav links, action buttons)
 *  - Stats section (all 6 cards visible)
 *  - PSC legend row visible
 *  - Filters panel visible
 *  - Appointments table visible with toolbar
 *  - Pagination footer visible
 *  - Page does not show JS error overlay
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard – page integrity', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto();
  });

  // ── URL & title ─────────────────────────────────────────────────────────
  test('lands on "/" with 200 status', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL('/');
  });

  // ── Header ───────────────────────────────────────────────────────────────
  test('header shows brand name "MediFlow"', async ({ page }) => {
    const brand = page.locator('header, nav').filter({ hasText: 'MediFlow' }).first()
      .or(page.locator('[class*="header"]').filter({ hasText: 'MediFlow' }).first())
      .or(page.locator('span, a', { hasText: 'MediFlow' }).first());
    await expect(brand).toBeVisible();
  });

  test('header shows Import button', async () => {
    await expect(dashboard.importButton).toBeVisible();
  });

  test('header shows PA Settings link', async () => {
    await expect(dashboard.paSettingsLink).toBeVisible();
  });

  test('header shows Export button', async () => {
    await expect(dashboard.exportDropdownButton).toBeVisible();
  });

  test('header shows Logout button', async ({ page }) => {
    const logoutBtn = page.locator('button', { hasText: /Logout|Log out/i });
    await expect(logoutBtn).toBeVisible();
  });

  // ── Stats Section ─────────────────────────────────────────────────────────
  test('shows all 6 stat cards', async () => {
    await expect(dashboard.totalAppointmentsCard).toBeVisible();
    await expect(dashboard.eligibleCard).toBeVisible();
    await expect(dashboard.notEligibleCard).toBeVisible();
    await expect(dashboard.verificationPendingCard).toBeVisible();
    await expect(dashboard.authCountCard).toBeVisible();
    await expect(dashboard.refCountCard).toBeVisible();
  });

  test('each stat card shows a numeric value', async ({ page }) => {
    const cards = [
      dashboard.totalAppointmentsCard,
      dashboard.eligibleCard,
      dashboard.notEligibleCard,
      dashboard.verificationPendingCard,
      dashboard.authCountCard,
      dashboard.refCountCard,
    ];

    for (const card of cards) {
      await expect(card).toBeVisible();
      // The value is the large number element inside each card
      const value = card.locator('p.text-3xl');
      await expect(value).toBeVisible();
      const text = await value.textContent();
      // Should be a numeric string
      expect(text?.trim()).toMatch(/^\d+$/);
    }
  });

  test('PSC legend row is visible with all 6 codes', async () => {
    const pscLegend = dashboard.pscLegend;
    await expect(pscLegend).toBeVisible();

    const expectedCodes = [
      'Eligibility Completed',
      'Eligibility Not Found',
      'No Collection Required',
      'Provider Not Credentialed',
      'Payment Completed',
      'Self Pay',
    ];

    for (const code of expectedCodes) {
      await expect(pscLegend.locator('button', { hasText: code })).toBeVisible();
    }
  });

  // ── Filters Panel ─────────────────────────────────────────────────────────
  test('filters panel is visible', async ({ page }) => {
    const filterPanel = page.locator('.rounded-2xl').filter({ hasText: 'Appointment Date' }).first();
    await expect(filterPanel).toBeVisible();
  });

  test('filter panel has date range inputs', async () => {
    await expect(dashboard.dateFromInput).toBeVisible();
    await expect(dashboard.dateToInput).toBeVisible();
  });

  test('filter panel has patient search input', async () => {
    await expect(dashboard.patientSearchInput).toBeVisible();
  });

  test('filter panel has Filter and Clear buttons', async () => {
    await expect(dashboard.filterApplyButton).toBeVisible();
    await expect(dashboard.filterClearButton).toBeVisible();
  });

  // ── Appointments Table ────────────────────────────────────────────────────
  test('appointments table container is visible', async () => {
    await expect(dashboard.tableContainer).toBeVisible();
  });

  test('table toolbar shows view mode toggle (Compact / Expanded)', async () => {
    await expect(dashboard.compactViewButton).toBeVisible();
    await expect(dashboard.expandedViewButton).toBeVisible();
  });

  test('table toolbar defaults to Compact view', async () => {
    await expect(dashboard.viewModeLabel).toContainText('Compact View');
  });

  test('pagination footer is visible', async () => {
    await expect(dashboard.paginationPrev).toBeVisible();
    await expect(dashboard.paginationNext).toBeVisible();
    await expect(dashboard.paginationInfo).toBeVisible();
  });

  // ── No JS errors ──────────────────────────────────────────────────────────
  test('page loads without uncaught JS exceptions', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    // Short wait to allow any immediate errors
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });

  // ── Responsive layout ─────────────────────────────────────────────────────
  test('page is scrollable without horizontal overflow', async ({ page }) => {
    const bodyWidth    = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    // Allow a small tolerance (scrollbar can add a few px)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
