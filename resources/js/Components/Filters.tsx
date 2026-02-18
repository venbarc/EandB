import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, Filter, X, ChevronDown, Check } from 'lucide-react';
import { FilterOptions, FilterState } from '@/types';

interface FiltersProps {
  filters: FilterState;
  filterOptions: FilterOptions;
}

export const Filters: React.FC<FiltersProps> = ({ filters, filterOptions }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState<FilterState>({
    date:      filters.date      ?? '',
    patient:   filters.patient   ?? '',
    provider:  filters.provider  ?? '',
    status:    filters.status    ?? '',
    location:  filters.location  ?? '',
    auth:      filters.auth      ?? '',
    referral:  filters.referral  ?? '',
    insurances: filters.insurances ?? [],
  });

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const toggleInsurance = (ins: string) => {
    const current = form.insurances ?? [];
    setForm(prev => ({
      ...prev,
      insurances: current.includes(ins)
        ? current.filter(i => i !== ins)
        : [...current, ins],
    }));
  };

  const handleFilter = () => {
    const params: Record<string, unknown> = {};
    if (form.date)     params.date     = form.date;
    if (form.patient)  params.patient  = form.patient;
    if (form.provider) params.provider = form.provider;
    if (form.status)   params.status   = form.status;
    if (form.location) params.location = form.location;
    if (form.auth)     params.auth     = form.auth;
    if (form.referral) params.referral = form.referral;
    if ((form.insurances ?? []).length > 0) params.insurances = form.insurances;
    router.get('/', params, { preserveState: true, preserveScroll: true });
    setOpenDropdown(null);
  };

  const handleClear = () => {
    setForm({ date: '', patient: '', provider: '', status: '', location: '', auth: '', referral: '', insurances: [] });
    router.get('/', {}, { preserveState: false });
    setOpenDropdown(null);
  };

  // Generic select dropdown
  const FilterDropdown: React.FC<{
    label: string;
    name: keyof FilterState;
    options: string[];
    value: string;
  }> = ({ label, name, options, value }) => (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <button
        onClick={() => toggleDropdown(name)}
        className="w-full text-left bg-white border border-gray-300 hover:border-brand-500 text-gray-700 text-sm rounded-lg px-3 py-2 flex items-center justify-between shadow-sm transition-colors focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
      >
        <span className="truncate">{value || 'Select…'}</span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>
      {openDropdown === name && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
          <div
            className="px-3 py-1.5 hover:bg-gray-50 text-sm text-gray-500 cursor-pointer"
            onClick={() => { setForm(prev => ({ ...prev, [name]: '' })); setOpenDropdown(null); }}
          >
            — None —
          </div>
          {options.map(opt => (
            <div
              key={opt}
              className={`px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer flex items-center gap-2 ${value === opt ? 'text-brand-700 font-medium' : 'text-gray-700'}`}
              onClick={() => { setForm(prev => ({ ...prev, [name]: opt })); setOpenDropdown(null); }}
            >
              {value === opt && <Check size={12} className="text-brand-600" />}
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Multi-select insurance dropdown
  const InsuranceDropdown: React.FC = () => {
    const selected = form.insurances ?? [];
    return (
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Insurance Type</label>
        <button
          onClick={() => toggleDropdown('insuranceType')}
          className="w-full text-left bg-white border border-gray-300 hover:border-brand-500 text-gray-700 text-sm rounded-lg px-3 py-2 flex items-center justify-between shadow-sm transition-colors focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
        >
          <span className="truncate">
            {selected.length > 0 ? `${selected.length} Selected` : 'Select…'}
          </span>
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        </button>
        {openDropdown === 'insuranceType' && (
          <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
            {filterOptions.insurances.map(opt => (
              <div
                key={opt}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => toggleInsurance(opt)}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 ${selected.includes(opt) ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                  {selected.includes(opt) && <Check size={10} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700 truncate">{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">

        {/* Date Picker */}
        <div className="w-full lg:w-48">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Appointment Date</label>
          <div className="relative">
            <input
              type="date"
              value={form.date ?? ''}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block pl-10 p-2 shadow-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleFilter}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all"
          >
            <Filter size={16} /> Filter
          </button>
          <button
            onClick={handleClear}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-500 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all"
          >
            <X size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

        {/* Patient Search */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Patient Search</label>
          <input
            type="text"
            value={form.patient ?? ''}
            onChange={e => setForm(prev => ({ ...prev, patient: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            placeholder="Search name or ID…"
            className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
          />
        </div>

        <InsuranceDropdown />

        <FilterDropdown label="Location"   name="location" options={filterOptions.locations}  value={form.location ?? ''} />
        <FilterDropdown label="Provider"   name="provider" options={filterOptions.providers}  value={form.provider ?? ''} />
        <FilterDropdown label="Appt Status" name="status"  options={filterOptions.statuses}   value={form.status ?? ''} />

        <FilterDropdown
          label="Auth Required" name="auth"
          options={['Auth Required', 'N/A']}
          value={form.auth ?? ''}
        />
        <FilterDropdown
          label="Referral Required" name="referral"
          options={['Required', 'N/A']}
          value={form.referral ?? ''}
        />
      </div>
    </div>
  );
};
