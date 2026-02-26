import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, Filter, X, ChevronDown, Check, Search } from 'lucide-react';
import { FilterOptions, FilterState } from '@/types';

interface FiltersProps {
  filters: FilterState;
  filterOptions: FilterOptions;
}

export const Filters: React.FC<FiltersProps> = ({ filters, filterOptions }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState<FilterState>({
    dateFrom: filters.dateFrom ?? '',
    dateTo: filters.dateTo ?? '',
    ampm: filters.ampm ?? '',
    patient: filters.patient ?? '',
    provider: filters.provider ?? '',
    status: filters.status ?? '',
    location: filters.location ?? '',
    auth: filters.auth ?? '',
    referral: filters.referral ?? '',
    eligibility: filters.eligibility ?? '',
    insurances: filters.insurances ?? [],
    insuranceType: filters.insuranceType ?? '',
    sort: filters.sort ?? '',
    direction: filters.direction,
  });

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleFilter = () => {
    const params: Record<string, string | string[]> = {};
    if (form.dateFrom) params.dateFrom = form.dateFrom;
    if (form.dateTo) params.dateTo = form.dateTo;
    if (form.ampm) params.ampm = form.ampm;
    if (form.patient) params.patient = form.patient;
    if (form.provider) params.provider = form.provider;
    if (form.status) params.status = form.status;
    if (form.location) params.location = form.location;
    if (form.auth) params.auth = form.auth;
    if (form.referral) params.referral = form.referral;
    if (form.eligibility) params.eligibility = form.eligibility;
    if (form.insuranceType) params.insuranceType = form.insuranceType;
    if (form.sort) params.sort = form.sort;
    if (form.direction) params.direction = form.direction;
    if ((form.insurances ?? []).length > 0) params.insurances = form.insurances ?? [];

    router.get('/', params, { preserveState: true, preserveScroll: true });
    setOpenDropdown(null);
  };

  const handleClear = () => {
    setForm({
      dateFrom: '',
      dateTo: '',
      ampm: '',
      patient: '',
      provider: '',
      status: '',
      location: '',
      auth: '',
      referral: '',
      eligibility: '',
      insurances: [],
      insuranceType: '',
      sort: '',
      direction: undefined,
    });
    router.get('/', {}, { preserveState: false });
    setOpenDropdown(null);
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/30';

  const FilterDropdown: React.FC<{
    label: string;
    name: keyof FilterState;
    options: string[];
    value: string;
  }> = ({ label, name, options, value }) => (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">{label}</label>
      <button
        type="button"
        onClick={() => toggleDropdown(name)}
        className={`${fieldClass} flex items-center justify-between text-left`}
      >
        <span className="truncate">{value || 'Select...'}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {openDropdown === name && (
        <div className="absolute z-50 mt-1.5 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            onClick={() => {
              setForm((prev) => ({ ...prev, [name]: '' }));
              setOpenDropdown(null);
            }}
          >
            None
          </button>
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-slate-50 ${
                value === option ? 'font-semibold text-teal-600' : 'text-slate-700'
              }`}
              onClick={() => {
                setForm((prev) => ({ ...prev, [name]: option }));
                setOpenDropdown(null);
              }}
            >
              {value === option && <Check size={12} />}
              <span className="truncate">{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">

          {/* Appointment Date Range + AM/PM */}
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">Appointment Date</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={form.dateFrom ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className={`${fieldClass} pl-9 [color-scheme:light]`}
                />
                <Calendar size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="shrink-0 text-xs text-slate-400">to</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={form.dateTo ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className={`${fieldClass} pl-9 [color-scheme:light]`}
                />
                <Calendar size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* AM / PM filter */}
          <FilterDropdown label="AM / PM" name="ampm" options={['AM', 'PM']} value={form.ampm ?? ''} />

          {/* Patient Search */}
          <div className="relative xl:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">Patient Search</label>
            <input
              type="text"
              value={form.patient ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, patient: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              placeholder="Search by name, ID, or date of birth..."
              className={`${fieldClass} pl-10`}
            />
            <Search size={15} className="pointer-events-none absolute left-3 top-[34px] text-slate-400" />
          </div>

          <FilterDropdown label="Location" name="location" options={filterOptions.locations} value={form.location ?? ''} />
          <FilterDropdown label="Provider" name="provider" options={filterOptions.providers} value={form.provider ?? ''} />
          <FilterDropdown label="Appt Reason" name="status" options={filterOptions.statuses} value={form.status ?? ''} />
          <FilterDropdown label="Auth Required" name="auth" options={['Auth Active', 'Auth Required', 'No Auth Required', 'For Review']} value={form.auth ?? ''} />
          <FilterDropdown label="Referral Required" name="referral" options={['Required', 'N/A']} value={form.referral ?? ''} />
          <FilterDropdown label="E&B Status" name="eligibility" options={['Eligible', 'Not Eligible', 'Verification Pending']} value={form.eligibility ?? ''} />
          <FilterDropdown label="Insurance Type" name="insuranceType" options={filterOptions.insuranceTypes} value={form.insuranceType ?? ''} />
        </div>

        <div className="flex items-center gap-2 md:pb-0.5">
          <button
            type="button"
            onClick={handleFilter}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-teal-400"
          >
            <Filter size={15} />
            Filter
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <X size={15} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
