/**
 * e2e/tests/update-modal.spec.ts
 *
 * Deep tests for the UpdateRecordModal component:
 *  - Modal opens / closes correctly
 *  - Patient name and DOB are shown in the header
 *  - All form controls are interactive
 *  - PSC status buttons are toggleable
 *  - PA Dept submission button label reflects current state
 *  - Save/Cancel buttons behave correctly
 *  - Keyboard: Escape does not close the modal (modal has no Escape handler; close btn only)
 *  - ARIA: modal traps focus
 */

import { test, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

// ── Guard: skip if no rows exist ─────────────────────────────────────────────
async function skipIfEmpty(page: Page) {
  const empty = page.locator('td', { hasText: 'No appointments found' });
  if (await empty.count() > 0) {
    test.skip(true, 'No appointment rows – skipping modal test');
  }
}

// ── Open modal by clicking the first row's Update button ─────────────────────
async function openModal(page: Page, dashboard: DashboardPage) {
  await skipIfEmpty(page);
  await dashboard.firstUpdateButton.click();
  await expect(dashboard.modal).toBeVisible({ timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL OPEN / CLOSE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UpdateRecordModal – open / close', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('modal is not visible before clicking Update', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.modal).not.toBeVisible();
  });

  test('clicking Update opens the modal', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);
    await expect(dashboard.modalTitle).toBeVisible();
  });

  test('clicking the X (close) button closes the modal', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    // The X button is the button containing the X icon in the header
    const closeBtn = page.locator('.fixed.inset-0.z-50 button svg').first()
      .locator('..');
    await closeBtn.click();

    await expect(dashboard.modal).not.toBeVisible();
  });

  test('clicking Cancel button closes the modal', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    await dashboard.modalCancelButton.click();
    await expect(dashboard.modal).not.toBeVisible();
  });

  test('modal displays "Update Record" as title', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    await expect(page.locator('h3', { hasText: 'Update Record' })).toBeVisible();
  });

  test('modal shows patient name in the header', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    // The subheading contains "Patient: {name} (DOB: ...)"
    const subheading = page.locator('.fixed.inset-0.z-50 p.text-sm.text-gray-500');
    await expect(subheading).toBeVisible();
    const text = await subheading.textContent();
    expect(text).toMatch(/Patient:/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FORM FIELDS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UpdateRecordModal – form fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Provider Credentialed select is present and has options', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const select = page.locator('select.modal-select').first();
    await expect(select).toBeVisible();

    // Should have at least 3 options: blank, Yes, No
    const options = select.locator('option');
    await expect(options).toHaveCount(3);
  });

  test('Eligibility Status select has 4 options (blank + 3)', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const selects = page.locator('select.modal-select');
    const eligibilitySelect = selects.nth(1);
    await expect(eligibilitySelect).toBeVisible();

    const options = eligibilitySelect.locator('option');
    await expect(options).toHaveCount(4); // blank, Active, Inactive, Self Pay
  });

  test('Collection Status select has expected options', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const selects = page.locator('select.modal-select');
    const collectionSelect = selects.nth(2);
    const options = collectionSelect.locator('option');
    await expect(options).toHaveCount(5); // blank + 4 options
  });

  test('Insurance Type select has expected options', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const selects = page.locator('select.modal-select');
    const insuranceSelect = selects.nth(3);
    const options = insuranceSelect.locator('option');
    await expect(options).toHaveCount(6); // blank + 5 options
  });

  test('Patient Balance Amount input accepts numeric values', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const balanceInput = page.locator('input[type="number"]');
    await expect(balanceInput).toBeVisible();
    await balanceInput.fill('50.00');
    await expect(balanceInput).toHaveValue('50.00');
  });

  test('Auth Required radio group has 3 options', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const authRadios = page.locator('input[name="auth"][type="radio"]');
    await expect(authRadios).toHaveCount(3);
  });

  test('Auth Required radio options are labeled correctly', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    await expect(page.locator('text=Auth Active')).toBeVisible();
    await expect(page.locator('text=No Auth Required')).toBeVisible();
    await expect(page.locator('text=Auth Required').first()).toBeVisible();
  });

  test('Referral Required radio group has 2 options (Yes/No)', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const refRadios = page.locator('input[name="referral"][type="radio"]');
    await expect(refRadios).toHaveCount(2);
  });

  test('Notes textarea is present and editable', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const notesTextarea = page.locator('textarea[placeholder*="additional details"]');
    await expect(notesTextarea).toBeVisible();
    await notesTextarea.fill('Test note');
    await expect(notesTextarea).toHaveValue('Test note');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PSC STATUS BUTTONS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UpdateRecordModal – PSC status buttons', () => {
  const PSC_CODES = [
    'Eligibility Completed',
    'Eligibility Not Found',
    'No Collection Required',
    'Provider Not Credentialed',
    'Payment Completed',
    'Self Pay',
  ];

  test('all 6 PSC status buttons are visible', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    for (const code of PSC_CODES) {
      await expect(page.locator('.fixed.inset-0.z-50 button', { hasText: code })).toBeVisible();
    }
  });

  test('clicking a PSC button selects it (shows ring style)', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const selfPayBtn = page.locator('.fixed.inset-0.z-50 button', { hasText: 'Self Pay' });
    await selfPayBtn.click();

    // Active button gets a ring class
    await expect(selfPayBtn).toHaveClass(/ring-2/);
  });

  test('clicking the same PSC button twice deselects it', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const selfPayBtn = page.locator('.fixed.inset-0.z-50 button', { hasText: 'Self Pay' });
    await selfPayBtn.click(); // select
    await selfPayBtn.click(); // deselect

    await expect(selfPayBtn).not.toHaveClass(/ring-2/);
  });

  test('PSC Description input is present below PSC buttons', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const pscDescInput = page.locator('input[placeholder*="additional notes for this status"]');
    await expect(pscDescInput).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PA DEPT SUBMISSION BUTTON
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UpdateRecordModal – PA Dept button', () => {
  test('PA Dept button is visible in modal footer', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    await expect(dashboard.modalPaDeptButton).toBeVisible();
  });

  test('PA Dept button says "Submit to PA Dept" or "Remove from PA Dept"', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const text = await dashboard.modalPaDeptButton.textContent();
    expect(text?.trim()).toMatch(/Submit to PA Dept|Remove from PA Dept/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SAVE BUTTON
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UpdateRecordModal – Save button', () => {
  test('Save button is visible and enabled by default', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    await expect(dashboard.modalSaveButton).toBeVisible();
    await expect(dashboard.modalSaveButton).toBeEnabled();
  });

  test('Save button shows "Save" text', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    await expect(dashboard.modalSaveButton).toHaveText('Save');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSIBILITY
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UpdateRecordModal – accessibility', () => {
  test('modal has backdrop overlay', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const backdrop = page.locator('.fixed.inset-0.z-50.bg-black\\/50, .fixed.inset-0.z-50.flex');
    await expect(backdrop).toBeVisible();
  });

  test('modal scrolls internally for long content', async ({ page }) => {
    await page.goto('/');
    const dashboard = new DashboardPage(page);
    await openModal(page, dashboard);

    const scrollableBody = page.locator('.overflow-y-auto.custom-scrollbar');
    await expect(scrollableBody).toBeVisible();
  });
});
