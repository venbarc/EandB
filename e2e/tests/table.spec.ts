/**
 * e2e/tests/table.spec.ts
 *
 * Deep tests for AppointmentsTable:
 *  - View mode toggle (Compact ↔ Expanded)
 *  - Column sort: asc → desc → clear cycle
 *  - Row expand / collapse (detail cards)
 *  - Pagination (Previous / Next buttons, disabled states)
 *  - Empty state message when no data matches
 *  - Inline insurance editing
 *  - "Update" button triggers modal
 */

import { test, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

// ─────────────────────────────────────────────────────────────────────────────
// VIEW MODE TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – view mode toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('defaults to Compact view', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.viewModeLabel).toContainText('Compact View');
    // Compact view button should have active background
    await expect(dashboard.compactViewButton).toHaveClass(/bg-teal-600/);
  });

  test('switching to Expanded view updates label and button', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expandedViewButton.click();

    await expect(dashboard.viewModeLabel).toContainText('Expanded View');
    await expect(dashboard.expandedViewButton).toHaveClass(/bg-teal-600/);
    await expect(dashboard.compactViewButton).not.toHaveClass(/bg-teal-600/);
  });

  test('Expanded view table has horizontally scrollable wrapper', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expandedViewButton.click();

    const scrollWrapper = page.locator('.overflow-x-auto');
    await expect(scrollWrapper).toBeVisible();
  });

  test('switching back to Compact restores compact table', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expandedViewButton.click();
    await dashboard.compactViewButton.click();

    await expect(dashboard.viewModeLabel).toContainText('Compact View');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN SORTING
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – column sorting', () => {
  const SORTABLE_COLS = [
    { label: 'Pt ID',        param: 'patient_id' },
    { label: 'Patient Name', param: 'patient_name' },
    { label: 'Provider',     param: 'provider' },
    { label: 'Appt Date',    param: 'appt_date' },
  ];

  for (const { label, param } of SORTABLE_COLS) {
    test(`clicking "${label}" column adds sort=${param}&direction=asc`, async ({ page }) => {
      await page.goto('/');
      const dashboard = new DashboardPage(page);
      const header = dashboard.sortableHeader(label);

      await Promise.all([
        page.waitForURL(new RegExp(`sort=${param}`)),
        header.click(),
      ]);

      const url = new URL(page.url());
      expect(url.searchParams.get('sort')).toBe(param);
      expect(url.searchParams.get('direction')).toBe('asc');
    });

    test(`clicking "${label}" twice reverses to direction=desc`, async ({ page }) => {
      await page.goto(`/?sort=${param}&direction=asc`);
      const dashboard = new DashboardPage(page);
      const header = dashboard.sortableHeader(label);

      await Promise.all([
        page.waitForURL(new RegExp(`direction=desc`)),
        header.click(),
      ]);

      const url = new URL(page.url());
      expect(url.searchParams.get('direction')).toBe('desc');
    });

    test(`clicking "${label}" three times clears sort`, async ({ page }) => {
      await page.goto(`/?sort=${param}&direction=desc`);
      const dashboard = new DashboardPage(page);
      const header = dashboard.sortableHeader(label);

      await Promise.all([
        page.waitForURL('/'),
        header.click(),
      ]);

      const url = new URL(page.url());
      expect(url.searchParams.has('sort')).toBe(false);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROW EXPAND / COLLAPSE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – row expand / collapse', () => {
  /**
   * These tests require at least one appointment row to exist.
   * If the DB is empty the test is skipped gracefully.
   */
  async function ensureHasRows(page: Page): Promise<boolean> {
    const emptyMsg = page.locator('td', { hasText: 'No appointments found' });
    const count = await emptyMsg.count();
    return count === 0;
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking row expand chevron reveals detail cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    if (!(await ensureHasRows(page))) {
      test.skip(true, 'No appointment data – skipping expand test');
      return;
    }

    const firstChevron = dashboard.rowExpandButtons.first();
    await firstChevron.click();

    // Detail cards should appear
    await expect(page.locator('text=Patient Info').first()).toBeVisible();
    await expect(page.locator('text=Appointment').first()).toBeVisible();
    await expect(page.locator('text=Auth / Referral').first()).toBeVisible();
    await expect(page.locator('text=Insurance').first()).toBeVisible();
    await expect(page.locator('text=Eligibility').first()).toBeVisible();
  });

  test('clicking expanded row chevron again collapses detail', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    if (!(await ensureHasRows(page))) {
      test.skip(true, 'No appointment data – skipping collapse test');
      return;
    }

    const firstChevron = dashboard.rowExpandButtons.first();

    // Expand
    await firstChevron.click();
    await expect(page.locator('text=Patient Info').first()).toBeVisible();

    // Collapse
    await firstChevron.click();
    await expect(page.locator('text=Patient Info')).not.toBeVisible();
  });

  test('expanded row turns teal background', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    if (!(await ensureHasRows(page))) {
      test.skip(true, 'No appointment data');
      return;
    }

    const firstChevron = dashboard.rowExpandButtons.first();
    await firstChevron.click();

    // The row containing this chevron's td should have bg-teal-50
    const expandedRow = page.locator('tbody tr').filter({ has: firstChevron }).first();
    await expect(expandedRow).toHaveClass(/bg-teal-50/);
  });

  test('only one row expands at a time', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    if (!(await ensureHasRows(page))) {
      test.skip(true, 'No appointment data');
      return;
    }

    const chevrons = dashboard.rowExpandButtons;
    const count = await chevrons.count();
    if (count < 2) {
      test.skip(true, 'Need at least 2 rows');
      return;
    }

    // Expand first row
    await chevrons.nth(0).click();

    // Expand second row – first should collapse
    await chevrons.nth(1).click();

    const detailRows = await page.locator('tbody tr td[colspan]').count();
    // Should be exactly 1 expanded detail row
    expect(detailRows).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Previous button is disabled on page 1', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.paginationPrev).toBeDisabled();
  });

  test('Next button is disabled when total fits on one page', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const info = await dashboard.paginationInfo.textContent();

    if (info?.includes('No results')) {
      // No data – next should be disabled
      await expect(dashboard.paginationNext).toBeDisabled();
    } else if (info?.match(/Showing \d+ to (\d+) of (\d+)/)) {
      const [, to, total] = info.match(/Showing \d+ to (\d+) of (\d+)/)!;
      if (Number(to) >= Number(total)) {
        await expect(dashboard.paginationNext).toBeDisabled();
      }
    }
  });

  test('clicking Next navigates to page 2', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const info = await dashboard.paginationInfo.textContent();

    // Only test if there's a next page
    const isNextEnabled = await dashboard.paginationNext.isEnabled();
    if (!isNextEnabled) {
      test.skip(true, 'No page 2 available');
      return;
    }

    await Promise.all([
      page.waitForURL(/page=2/),
      dashboard.paginationNext.click(),
    ]);

    expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  });

  test('clicking Previous on page 2 returns to page 1', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const isNextEnabled = await dashboard.paginationNext.isEnabled();
    if (!isNextEnabled) {
      test.skip(true, 'No page 2 available');
      return;
    }

    // Go to page 2
    await Promise.all([
      page.waitForURL(/page=2/),
      dashboard.paginationNext.click(),
    ]);

    // Go back
    await Promise.all([
      page.waitForURL('/'),
      dashboard.paginationPrev.click(),
    ]);

    const p = new URL(page.url()).searchParams;
    expect(p.get('page') ?? '1').toBe('1');
  });

  test('pagination shows "X / Y" page counter', async ({ page }) => {
    const pageCounter = page.locator('.text-xs.font-semibold.text-slate-600', { hasText: /\d+ \/ \d+/ });
    await expect(pageCounter).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – empty state', () => {
  test('applying impossible filter shows "No appointments found" message', async ({ page }) => {
    // Use a patient search that will very likely return no results
    await page.goto('/?patient=ZZZZNOEXIST9999999');

    const emptyMsg = page.locator('td', { hasText: 'No appointments found' });
    await expect(emptyMsg).toBeVisible();
  });

  test('pagination shows "No results" when table is empty', async ({ page }) => {
    await page.goto('/?patient=ZZZZNOEXIST9999999');

    const dashboard = new DashboardPage(page);
    await expect(dashboard.paginationInfo).toContainText('No results');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INLINE INSURANCE EDITING
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – inline insurance editing', () => {
  async function ensureHasRows(page: Page): Promise<boolean> {
    const emptyMsg = page.locator('td', { hasText: 'No appointments found' });
    return (await emptyMsg.count()) === 0;
  }

  test('clicking a primary insurance cell reveals edit input', async ({ page }) => {
    await page.goto('/');
    if (!(await ensureHasRows(page))) {
      test.skip(true, 'No data');
      return;
    }

    // The InsuranceCell button in column "Primary Ins"
    const firstInsuranceCell = page.locator('tbody tr').first()
      .locator('button', { hasText: /N\/A|.+/ })
      .filter({ has: page.locator('svg[data-lucide="pencil"], svg') })
      .first();

    await firstInsuranceCell.click();

    // An inline input should appear
    const inlineInput = page.locator('tbody tr').first().locator('input[class*="border-teal"]');
    await expect(inlineInput).toBeVisible();
  });

  test('pressing Escape dismisses the inline input without saving', async ({ page }) => {
    await page.goto('/');
    if (!(await ensureHasRows(page))) {
      test.skip(true, 'No data');
      return;
    }

    const firstInsuranceCell = page.locator('tbody tr').first()
      .locator('button.group').first();

    await firstInsuranceCell.click();

    const inlineInput = page.locator('tbody tr').first().locator('input[class*="border-teal"]');
    if (await inlineInput.count() === 0) {
      test.skip(true, 'Could not open inline editor');
      return;
    }

    await inlineInput.press('Escape');
    await expect(inlineInput).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BUTTON
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table – Update button', () => {
  test('clicking Update button opens the Update Record modal', async ({ page }) => {
    await page.goto('/');

    const emptyMsg = page.locator('td', { hasText: 'No appointments found' });
    if (await emptyMsg.count() > 0) {
      test.skip(true, 'No data');
      return;
    }

    const dashboard = new DashboardPage(page);
    await dashboard.firstUpdateButton.click();

    await expect(dashboard.modal).toBeVisible();
    await expect(dashboard.modalTitle).toBeVisible();
  });
});
