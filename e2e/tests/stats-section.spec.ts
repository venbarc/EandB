/**
 * e2e/tests/stats-section.spec.ts
 *
 * Deep tests for the StatsSection component:
 *  - Each stat card navigates to the correct filtered URL
 *  - Active card gains a ring/border highlight
 *  - Clicking "Total Appointments" clears all filters
 *  - PSC legend buttons toggle the pscCode query param
 *  - Active PSC button shows a coloured background
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Stats Section – stat cards', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    // Start from a clean (no-filter) dashboard
    await page.goto('/');
  });

  test('"Eligible" card navigates to /?eligibility=Eligible', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/eligibility=Eligible/),
      dashboard.eligibleCard.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.get('eligibility')).toBe('Eligible');
  });

  test('"Not Eligible" card navigates to /?eligibility=Not+Eligible', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/eligibility=Not\+Eligible|eligibility=Not%20Eligible/),
      dashboard.notEligibleCard.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.get('eligibility')).toBe('Not Eligible');
  });

  test('"Verification Pending" card navigates to /?eligibility=Verification+Pending', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/eligibility=Verification/),
      dashboard.verificationPendingCard.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.get('eligibility')).toBe('Verification Pending');
  });

  test('"Auth Count" card navigates to /?auth=Auth+Required', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/auth=Auth/),
      dashboard.authCountCard.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.get('auth')).toBe('Auth Required');
  });

  test('"Ref Count" card navigates to /?referral=Required', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/referral=Required/),
      dashboard.refCountCard.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.get('referral')).toBe('Required');
  });

  test('"Total Appointments" card clears all eligibility filters', async ({ page }) => {
    // First apply an eligibility filter
    await page.goto('/?eligibility=Eligible');
    await page.waitForURL(/eligibility=Eligible/);

    // Click Total Appointments to clear
    await Promise.all([
      page.waitForURL('/'),
      dashboard.totalAppointmentsCard.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.has('eligibility')).toBe(false);
  });

  test('active stat card has teal ring/border indicator', async ({ page }) => {
    // Click "Eligible"
    await Promise.all([
      page.waitForURL(/eligibility=Eligible/),
      dashboard.eligibleCard.click(),
    ]);

    // The active card should have border-teal-400 class
    await expect(dashboard.eligibleCard).toHaveClass(/border-teal-400/);
  });

  test('inactive stat cards do NOT have teal border', async ({ page }) => {
    // Navigate with eligibility=Eligible
    await page.goto('/?eligibility=Eligible');

    // Not-Eligible card should not be active
    await expect(dashboard.notEligibleCard).not.toHaveClass(/border-teal-400/);
  });

  test('only one eligibility stat card is active at a time', async ({ page }) => {
    await page.goto('/?eligibility=Eligible');

    const activeCards = await page.locator('button.border-teal-400').count();
    // At most 1 should be active (the Eligible card)
    expect(activeCards).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PSC LEGEND
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Stats Section – PSC legend', () => {
  const PSC_CODES = [
    'Eligibility Completed',
    'Eligibility Not Found',
    'No Collection Required',
    'Provider Not Credentialed',
    'Payment Completed',
    'Self Pay',
  ] as const;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const code of PSC_CODES) {
    test(`clicking "${code}" adds pscCode=${code} to URL`, async ({ page }) => {
      const dashboard = new DashboardPage(page);
      const btn = dashboard.pscLegendButton(code);

      await expect(btn).toBeVisible();

      await Promise.all([
        page.waitForURL(new RegExp(`pscCode=`)),
        btn.click(),
      ]);

      const url = new URL(page.url());
      expect(decodeURIComponent(url.searchParams.get('pscCode') ?? '')).toBe(code);
    });
  }

  test('clicking an active PSC button toggles the filter off', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const code = 'Self Pay';
    const btn = dashboard.pscLegendButton(code);

    // Activate
    await Promise.all([
      page.waitForURL(/pscCode=/),
      btn.click(),
    ]);

    // De-activate by clicking again
    await Promise.all([
      page.waitForURL('/'),
      btn.click(),
    ]);

    const url = new URL(page.url());
    expect(url.searchParams.has('pscCode')).toBe(false);
  });

  test('active PSC button has a coloured background class', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const code = 'Payment Completed';
    const btn = dashboard.pscLegendButton(code);

    await Promise.all([
      page.waitForURL(/pscCode=/),
      btn.click(),
    ]);

    // Active button should have one of the coloured bg classes (e.g. bg-emerald-100)
    const classes = await btn.getAttribute('class');
    const hasColorBg = /bg-(?:amber|red|orange|cyan|emerald|pink)-\d+/.test(classes ?? '');
    expect(hasColorBg).toBe(true);
  });
});
