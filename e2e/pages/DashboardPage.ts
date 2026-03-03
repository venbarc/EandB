import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for / (Dashboard)
 *
 * Covers: Header, StatsSection, Filters, AppointmentsTable, UpdateRecordModal
 */
export class DashboardPage {
  readonly page: Page;

  // ── Header ─────────────────────────────────────────────────────────────
  readonly importButton: Locator;
  readonly exportDropdownButton: Locator;
  readonly paSettingsLink: Locator;
  readonly logoutButton: Locator;
  readonly brandLogo: Locator;

  // ── Stats Section ───────────────────────────────────────────────────────
  readonly totalAppointmentsCard: Locator;
  readonly eligibleCard: Locator;
  readonly notEligibleCard: Locator;
  readonly verificationPendingCard: Locator;
  readonly authCountCard: Locator;
  readonly refCountCard: Locator;

  // ── PSC Legend buttons ──────────────────────────────────────────────────
  readonly pscLegend: Locator;

  // ── Filters ─────────────────────────────────────────────────────────────
  readonly filtersPanel: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly patientSearchInput: Locator;
  readonly filterApplyButton: Locator;
  readonly filterClearButton: Locator;

  // ── Table ────────────────────────────────────────────────────────────────
  readonly tableContainer: Locator;
  readonly compactViewButton: Locator;
  readonly expandedViewButton: Locator;
  readonly viewModeLabel: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly paginationInfo: Locator;
  readonly emptyState: Locator;

  // ── Update Record Modal ──────────────────────────────────────────────────
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly modalCloseButton: Locator;
  readonly modalSaveButton: Locator;
  readonly modalCancelButton: Locator;
  readonly modalPaDeptButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.importButton        = page.locator('button', { hasText: 'Import' });
    this.exportDropdownButton = page.locator('button', { hasText: 'Export' }).first();
    this.paSettingsLink      = page.locator('a[href="/pa-export-settings"]');
    this.logoutButton        = page.locator('form[action*="logout"] button, button:has-text("Logout")');
    this.brandLogo           = page.locator('span', { hasText: 'MediFlow' });

    // Stats
    this.totalAppointmentsCard    = page.locator('button', { hasText: 'Total Appointments' });
    this.eligibleCard             = page.locator('button', { hasText: 'Eligible' }).first();
    this.notEligibleCard          = page.locator('button', { hasText: 'Not Eligible' });
    this.verificationPendingCard  = page.locator('button', { hasText: 'Verification Pending' });
    this.authCountCard            = page.locator('button', { hasText: 'Auth Count' });
    this.refCountCard             = page.locator('button', { hasText: 'Ref Count' });
    this.pscLegend                = page.locator('.rounded-2xl.border.border-slate-200').filter({ hasText: 'Eligibility Completed' });

    // Filters
    this.filtersPanel        = page.locator('.rounded-2xl.border.border-slate-200.bg-white.p-4');
    this.dateFromInput       = page.locator('input[type="date"]').first();
    this.dateToInput         = page.locator('input[type="date"]').last();
    this.patientSearchInput  = page.locator('input[placeholder*="Search by name"]');
    this.filterApplyButton   = page.locator('button', { hasText: 'Filter' });
    this.filterClearButton   = page.locator('button', { hasText: 'Clear' });

    // Table
    this.tableContainer      = page.locator('.overflow-hidden.rounded-2xl.border.border-slate-200.bg-white.shadow-sm');
    this.compactViewButton   = page.locator('button', { hasText: 'Compact' });
    this.expandedViewButton  = page.locator('button', { hasText: 'Expanded' });
    this.viewModeLabel       = page.locator('.text-xs.font-medium.text-slate-500', { hasText: /View/ });
    this.paginationPrev      = page.locator('button', { hasText: 'Previous' });
    this.paginationNext      = page.locator('button', { hasText: 'Next' });
    this.paginationInfo      = page.locator('.text-xs.text-slate-600', { hasText: /Showing|No results/ });
    this.emptyState          = page.locator('td', { hasText: 'No appointments found' });

    // Modal
    this.modal               = page.locator('.fixed.inset-0.z-50');
    this.modalTitle          = page.locator('h3', { hasText: 'Update Record' });
    this.modalCloseButton    = page.locator('.fixed.inset-0.z-50 button').filter({ has: page.locator('svg') }).first();
    this.modalSaveButton     = page.locator('button', { hasText: 'Save' });
    this.modalCancelButton   = page.locator('button', { hasText: 'Cancel' });
    this.modalPaDeptButton   = page.locator('button', { hasText: /Submit to PA Dept|Remove from PA Dept/ });
  }

  async goto() {
    await this.page.goto('/');
  }

  /** Open a filter dropdown by its label text */
  dropdownByLabel(label: string): Locator {
    return this.page
      .locator('label', { hasText: label })
      .locator('..')
      .locator('button[type="button"]')
      .first();
  }

  /** Get options inside an open filter dropdown */
  get openDropdownOptions(): Locator {
    return this.page.locator('.absolute.z-50 button');
  }

  /** Get the first "Update" button in the table */
  get firstUpdateButton(): Locator {
    return this.page.locator('button', { hasText: 'Update' }).first();
  }

  /** Get all row expand chevron buttons */
  get rowExpandButtons(): Locator {
    return this.page.locator('tbody td:first-child button');
  }

  /** Get a sortable column header by its text */
  sortableHeader(label: string): Locator {
    return this.page.locator('thead button', { hasText: label });
  }

  /** PSC legend button by code text */
  pscLegendButton(code: string): Locator {
    return this.pscLegend.locator('button', { hasText: code });
  }

  /** Navigate to a specific page via URL */
  async goToPage(pageNum: number) {
    const url = new URL(this.page.url());
    url.searchParams.set('page', String(pageNum));
    await this.page.goto(url.toString());
  }
}
