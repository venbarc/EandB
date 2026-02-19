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
    date: filters.date ?? '',
    patient: filters.patient ?? '',
    provider: filters.provider ?? '',
    status: filters.status ?? '',
    location: filters.location ?? '',
    auth: filters.auth ?? '',
    referral: filters.referral ?? '',
    eligibility: filters.eligibility ?? '',
    insurances: filters.insurances ?? [],
    sort: filters.sort ?? '',
    direction: filters.direction,
  });

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const toggleInsurance = (insurance: string) => {
    const selected = form.insurances ?? [];
    setForm((prev) => ({
      ...prev,
      insurances: selected.includes(insurance)
        ? selected.filter((item) => item !== insurance)
        : [...selected, insurance],
    }));
  };

  const handleFilter = () => {
    const params: Record<string, string | string[]> = {};
    if (form.date) params.date = form.date;
    if (form.patient) params.patient = form.patient;
    if (form.provider) params.provider = form.provider;
    if (form.status) params.status = form.status;
    if (form.location) params.location = form.location;
    if (form.auth) params.auth = form.auth;
    if (form.referral) params.referral = form.referral;
    if (form.eligibility) params.eligibility = form.eligibility;
    if (form.sort) params.sort = form.sort;
    if (form.direction) params.direction = form.direction;
    if ((form.insurances ?? []).length > 0) params.insurances = form.insurances ?? [];

    router.get('/', params, { preserveState: true, preserveScroll: true });
    setOpenDropdown(null);
  };

  const handleClear = () => {
    setForm({
      date: '',
      patient: '',
      provider: '',
      status: '',
      location: '',
      auth: '',
      referral: '',
      eligibility: '',
      insurances: [],
      sort: '',
      direction: undefined,
    });
    router.get('/', {}, { preserveState: false });
    setOpenDropdown(null);
  };

  const fieldClass =
    'w-full rounded-xl border border-white/15 bg-slate-900/65 px-3 py-2.5 text-sm text-slate-100 shadow-sm transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30';

  const FilterDropdown: React.FC<{
    label: string;
    name: keyof FilterState;
    options: string[];
    value: string;
  }> = ({ label, name, options, value }) => (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">{label}</label>
      <button
        type="button"
        onClick={() => toggleDropdown(name)}
        className={`${fieldClass} flex items-center justify-between text-left`}
      >
        <span className="truncate">{value || 'Select...'}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {openDropdown === name && (
        <div className="absolute z-50 mt-1.5 max-h-52 w-full overflow-y-auto rounded-xl border border-white/15 bg-slate-900 p-1 shadow-xl">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-slate-300 transition hover:bg-white/10"
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
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-white/10 ${
                value === option ? 'font-semibold text-cyan-300' : 'text-slate-200'
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

  const InsuranceDropdown: React.FC = () => {
    const selected = form.insurances ?? [];
    return (
      <div className="relative">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Insurance Type</label>
        <button
          type="button"
          onClick={() => toggleDropdown('insuranceType')}
          className={`${fieldClass} flex items-center justify-between text-left`}
        >
          <span className="truncate">{selected.length > 0 ? `${selected.length} selected` : 'Select...'}</span>
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        </button>

        {openDropdown === 'insuranceType' && (
          <div className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/15 bg-slate-900 p-1 shadow-xl">
            {filterOptions.insurances.map((option) => (
              <button
                type="button"
                key={option}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-white/10"
                onClick={() => toggleInsurance(option)}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selected.includes(option)
                      ? 'border-cyan-400 bg-cyan-400 text-slate-900'
                      : 'border-white/30 bg-slate-900'
                  }`}
                >
                  {selected.includes(option) && <Check size={10} />}
                </span>
                <span className="truncate">{option}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative z-10 rounded-2xl border border-white/15 bg-slate-900/55 p-4 shadow-[0_20px_40px_-26px_rgba(2,12,27,0.95)] backdrop-blur-sm sm:p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="xl:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Appointment Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.date ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className={`${fieldClass} pl-10 [color-scheme:dark]`}
              />
              <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="relative xl:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Patient Search</label>
            <input
              type="text"
              value={form.patient ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, patient: event.target.value }))}
              onKeyDown={(event) => event.key === 'Enter' && handleFilter()}
              placeholder="Search patient name or ID..."
              className={`${fieldClass} pl-10`}
            />
            <Search size={15} className="pointer-events-none absolute left-3 top-[34px] text-slate-400" />
          </div>

          <InsuranceDropdown />
          <FilterDropdown label="Location" name="location" options={filterOptions.locations} value={form.location ?? ''} />
          <FilterDropdown label="Provider" name="provider" options={filterOptions.providers} value={form.provider ?? ''} />
          <FilterDropdown label="Appt Status" name="status" options={filterOptions.statuses} value={form.status ?? ''} />
          <FilterDropdown label="Auth Required" name="auth" options={['Auth Required', 'N/A']} value={form.auth ?? ''} />
          <FilterDropdown label="Referral Required" name="referral" options={['Required', 'N/A']} value={form.referral ?? ''} />
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/65 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-800/80"
          >
            <X size={15} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
