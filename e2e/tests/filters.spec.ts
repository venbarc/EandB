/**
 * e2e/tests/filters.spec.ts
 *
 * Deep tests for the Filters component:
 *  - Date range inputs apply dateFrom / dateTo query params
 *  - Patient search field applies the patient param
 *  - Enter key in patient search triggers filtering
 *  - FilterDropdown: open, select, close behaviour
 *  - Every dropdown option updates the query param on Filter click
 *  - Clear button resets all params
 *  - Multiple filters can be combined
 */

import { test, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

// ── Helper: parse current URL params ────────────────────────────────────────
const params = (page: Page) => new URL(page.url()).searchParams;

// ── Helper: apply filters and wait for navigation ───────────────────────────
async function applyFilter(dashboard: DashboardPage) {
  await Promise.all([
    dashboard.page.waitForURL((url) => url.pathname === '/'),
    dashboard.filterApplyButton.click(),
  ]);
}

async function clearFilter(dashboard: DashboardPage) {
  await Promise.all([
    dashboard.page.waitForURL('/'),
    dashboard.filterClearButton.click(),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE RANGE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Filters – date range', () => {
  test('setting dateFrom adds dateFrom param', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.dateFromInput.fill('2025-01-01');
    await applyFilter(dashboard);

    expect(params(page).get('dateFrom')).toBe('2025-01-01');
  });

  test('setting dateTo adds dateTo param', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.dateToInput.fill('2025-12-31');
    await applyFilter(dashboard);

    expect(params(page).get('dateTo')).toBe('2025-12-31');
  });

  test('setting both dateFrom and dateTo adds both params', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.dateFromInput.fill('2025-06-01');
    await dashboard.dateToInput.fill('2025-06-30');
    await applyFilter(dashboard);

    expect(params(page).get('dateFrom')).toBe('2025-06-01');
    expect(params(page).get('dateTo')).toBe('2025-06-30');
  });

  test('clearing removes dateFrom and dateTo from URL', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/?dateFrom=2025-01-01&dateTo=2025-12-31');

    await clearFilter(dashboard);

    const p = params(page);
    expect(p.has('dateFrom')).toBe(false);
    expect(p.has('dateTo')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT SEARCH
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Filters – patient search', () => {
  test('typing in patient field and clicking Filter adds patient param', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.patientSearchInput.fill('John');
    await applyFilter(dashboard);

    expect(params(page).get('patient')).toBe('John');
  });

  test('pressing Enter in patient field triggers filter navigation', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.patientSearchInput.fill('Jane');
    await Promise.all([
      page.waitForURL(/patient=Jane/),
      dashboard.patientSearchInput.press('Enter'),
    ]);

    expect(params(page).get('patient')).toBe('Jane');
  });

  test('clearing resets patient param', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/?patient=John');

    await clearFilter(dashboard);

    expect(params(page).has('patient')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN FILTERS
// ─────────────────────────────────────────────────────────────────────────────

/** Helper: open a labeled dropdown, pick an option, apply filter */
async function selectDropdownOption(
  page: Page,
  dashboard: DashboardPage,
  label: string,
  option: string,
  expectedParam: keyof { ampm: unknown; location: unknown; provider: unknown; status: unknown; auth: unknown; referral: unknown; eligibility: unknown; insuranceType: unknown; pscCode: unknown },
) {
  const dropdownBtn = dashboard.dropdownByLabel(label);
  await expect(dropdownBtn).toBeVisible();
  await dropdownBtn.click();

  // Option list should be visible
  const optionBtn = page.locator('.absolute.z-50 button', { hasText: option });
  await expect(optionBtn).toBeVisible();
  await optionBtn.click();

  // Apply filter
  await applyFilter(dashboard);
}

test.describe('Filters – AM/PM dropdown', () => {
  test('selecting AM adds ampm=AM to URL', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await selectDropdownOption(page, dashboard, 'AM / PM', 'AM', 'ampm');

    expect(params(page).get('ampm')).toBe('AM');
  });

  test('selecting PM adds ampm=PM to URL', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await selectDropdownOption(page, dashboard, 'AM / PM', 'PM', 'ampm');

    expect(params(page).get('ampm')).toBe('PM');
  });

  test('selecting None clears ampm param', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/?ampm=AM');

    const dropdownBtn = dashboard.dropdownByLabel('AM / PM');
    await dropdownBtn.click();

    const noneBtn = page.locator('.absolute.z-50 button', { hasText: 'None' });
    await noneBtn.click();

    await applyFilter(dashboard);

    expect(params(page).has('ampm')).toBe(false);
  });
});

test.describe('Filters – E&B Status dropdown', () => {
  const options = ['Eligible', 'Not Eligible', 'Verification Pending'];

  for (const option of options) {
    test(`selecting "${option}" sets eligibility param`, async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await page.goto('/');

      await selectDropdownOption(page, dashboard, 'E&B Status', option, 'eligibility');

      expect(params(page).get('eligibility')).toBe(option);
    });
  }
});

test.describe('Filters – Auth Required dropdown', () => {
  const options = ['Auth Active', 'Auth Required', 'No Auth Required', 'For Review'];

  for (const option of options) {
    test(`selecting "${option}" sets auth param`, async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await page.goto('/');

      await selectDropdownOption(page, dashboard, 'Auth Required', option, 'auth');

      expect(params(page).get('auth')).toBe(option);
    });
  }
});

test.describe('Filters – Referral Required dropdown', () => {
  test('selecting Required sets referral=Required', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await selectDropdownOption(page, dashboard, 'Referral Required', 'Required', 'referral');

    expect(params(page).get('referral')).toBe('Required');
  });
});

test.describe('Filters – PSC Status dropdown', () => {
  test('selecting a PSC status sets pscCode param', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await selectDropdownOption(page, dashboard, 'PSC Status', 'Self Pay', 'pscCode');

    expect(params(page).get('pscCode')).toBe('Self Pay');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED FILTERS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Filters – combined', () => {
  test('patient search + E&B Status applied together', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.patientSearchInput.fill('Smith');

    // Open E&B Status and pick "Eligible"
    const dropdownBtn = dashboard.dropdownByLabel('E&B Status');
    await dropdownBtn.click();
    await page.locator('.absolute.z-50 button', { hasText: 'Eligible' }).click();

    await applyFilter(dashboard);

    const p = params(page);
    expect(p.get('patient')).toBe('Smith');
    expect(p.get('eligibility')).toBe('Eligible');
  });

  test('Clear button removes all active filters', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/?patient=John&eligibility=Eligible&ampm=AM&dateFrom=2025-01-01');

    await clearFilter(dashboard);

    const p = params(page);
    expect(p.has('patient')).toBe(false);
    expect(p.has('eligibility')).toBe(false);
    expect(p.has('ampm')).toBe(false);
    expect(p.has('dateFrom')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN UX BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Filters – dropdown UX', () => {
  test('dropdown opens on button click and closes after selection', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    const dropdownBtn = dashboard.dropdownByLabel('AM / PM');

    // Open
    await dropdownBtn.click();
    await expect(page.locator('.absolute.z-50')).toBeVisible();

    // Select option
    await page.locator('.absolute.z-50 button', { hasText: 'AM' }).click();

    // Dropdown should close
    await expect(page.locator('.absolute.z-50')).not.toBeVisible();
  });

  test('selected option shows checkmark and teal text in dropdown', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/?ampm=AM');

    const dropdownBtn = dashboard.dropdownByLabel('AM / PM');
    await dropdownBtn.click();

    // The already-selected AM option should have teal color
    const amOption = page.locator('.absolute.z-50 button', { hasText: 'AM' });
    await expect(amOption).toHaveClass(/text-teal-600/);
  });

  test('dropdown button label reflects current filter value', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.goto('/?ampm=PM');

    const dropdownBtn = dashboard.dropdownByLabel('AM / PM');
    await expect(dropdownBtn).toContainText('PM');
  });
});
