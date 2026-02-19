import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Appointment, FilterState, PaginationMeta } from '@/types';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface AppointmentsTableProps {
  data: Appointment[];
  meta: PaginationMeta;
  currentFilters: FilterState;
  onUpdateRecord: (appt: Appointment) => void;
}

const DetailCard: React.FC<{ title: string; tone: string; children: React.ReactNode }> = ({ title, tone, children }) => (
  <div className="h-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/75 shadow-sm">
    <div className={`border-b border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white ${tone}`}>
      {title}
    </div>
    <div className="space-y-2 p-3.5 text-sm">{children}</div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-1.5 text-xs last:border-0 last:pb-0">
    <span className="font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
    <span className="max-w-[62%] text-right font-medium text-slate-100">{value}</span>
  </div>
);

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  data,
  meta,
  currentFilters,
  onUpdateRecord,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const goToPage = (page: number) => {
    router.get('/', { ...currentFilters, page }, { preserveState: true, preserveScroll: false });
  };

  const handleSort = (sortKey: string) => {
    const isSame = currentFilters.sort === sortKey;
    const nextDir = isSame && currentFilters.direction === 'asc' ? 'desc'
                  : isSame && currentFilters.direction === 'desc' ? null
                  : 'asc';
    const { sort: _s, direction: _d, page: _p, ...rest } = currentFilters as FilterState & { page?: number };
    const params = nextDir ? { ...rest, sort: sortKey, direction: nextDir } : rest;
    router.get('/', params, { preserveState: false });
  };

  const SortIcon: React.FC<{ sortKey: string }> = ({ sortKey }) => {
    if (currentFilters.sort !== sortKey) return <ArrowUpDown size={12} className="shrink-0 text-slate-500" />;
    return currentFilters.direction === 'asc'
      ? <ArrowUp size={12} className="shrink-0 text-cyan-300" />
      : <ArrowDown size={12} className="shrink-0 text-cyan-300" />;
  };

  const getStatusColor = (status: string) => {
    const key = status.toLowerCase();
    if (key.includes('confirm') || key.includes('checked')) return 'border-emerald-200 bg-emerald-100/70 text-emerald-800';
    if (key.includes('pending')) return 'border-amber-200 bg-amber-100/70 text-amber-800';
    if (key.includes('cancel')) return 'border-rose-200 bg-rose-100/70 text-rose-800';
    if (key.includes('show')) return 'border-red-200 bg-red-100/70 text-red-800';
    if (key.includes('new')) return 'border-indigo-200 bg-indigo-100/70 text-indigo-800';
    return 'border-slate-200 bg-slate-100/70 text-slate-700';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-slate-900/55 shadow-[0_20px_40px_-26px_rgba(2,12,27,0.95)] backdrop-blur-sm">
      <div className="overflow-x-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gradient-to-r from-slate-950 to-slate-900 text-white">
            <tr>
              <th className="w-8 px-3 py-3" />
              {([
                { label: 'Patient ID',           sortKey: 'patient_id' },
                { label: 'Patient Name',         sortKey: 'patient_name' },
                { label: 'Date of Birth',        sortKey: 'dob' },
                { label: 'Provider',             sortKey: 'provider' },
                { label: 'Appt Date',            sortKey: 'appt_date' },
                { label: 'Appt Status',          sortKey: 'appt_status' },
                { label: 'Confirmation',         sortKey: 'confirmation' },
                { label: 'Auth/Referral',        sortKey: null },
                { label: 'Primary Insurance',    sortKey: 'primary_insurance' },
                { label: 'Secondary Insurance',  sortKey: 'secondary_insurance' },
                { label: 'Visit Type',           sortKey: 'visit_type' },
                { label: 'Paid',                 sortKey: 'paid' },
                { label: 'Actions',              sortKey: null },
              ] as { label: string; sortKey: string | null }[]).map(({ label, sortKey }) => (
                <th key={label} className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-200/90">
                  {sortKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(sortKey)}
                      className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                    >
                      {label}
                      <SortIcon sortKey={sortKey} />
                    </button>
                  ) : label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10 bg-slate-900/35">
            {data.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-14 text-center text-sm font-medium text-slate-400">
                  No appointments found with the current filters.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className={`transition ${expandedId === row.id ? 'bg-cyan-500/10' : 'hover:bg-white/5'}`}>
                    <td className="cursor-pointer px-3 py-4" onClick={() => toggleExpand(row.id)}>
                      <button type="button" className="text-slate-500 transition hover:text-cyan-300">
                        {expandedId === row.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </td>

                    <td className="px-2 py-4 text-sm text-slate-400 truncate">{row.patient.id}</td>
                    <td className="px-2 py-4 text-sm font-semibold text-cyan-300 truncate" title={row.patient.name}>{row.patient.name}</td>
                    <td className="px-2 py-4 text-sm text-slate-400 truncate">{row.patient.dob}</td>
                    <td className="px-2 py-4 text-sm text-slate-100 truncate" title={row.provider}>{row.provider}</td>
                    <td className="px-2 py-4 text-sm text-slate-300">
                      <div className="flex flex-col">
                        <span>{row.date}</span>
                        <span className="text-xs text-slate-500">{row.time}</span>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-400 truncate" title={row.confirmationMethod}>{row.confirmationMethod}</td>
                    <td className="px-2 py-4 text-sm text-slate-400">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">Auth: {row.authStatus}</span>
                        <span className="text-xs">Ref: {row.referralStatus}</span>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-100 truncate" title={row.insurance.primary}>
                      {row.insurance.primary}
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-100 truncate" title={row.insurance.secondary || 'N/A'}>
                      {row.insurance.secondary || 'N/A'}
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-300 truncate" title={row.visitType}>{row.visitType}</td>
                    <td className="px-2 py-4 text-sm font-semibold text-slate-100">
                      {row.paidAmount > 0 ? `$${row.paidAmount.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateRecord(row)}
                          className="rounded-lg bg-cyan-500 px-2 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={14} className="bg-slate-950/40 p-0">
                        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
                          <DetailCard title="Patient Info" tone="bg-gradient-to-r from-cyan-600 to-blue-700">
                            <DetailRow label="Name" value={row.patient.name} />
                            <DetailRow label="Phone" value={row.patient.phone} />
                            <DetailRow label="Email" value={row.patient.email} />
                            <DetailRow label="Address" value={row.patient.address} />
                          </DetailCard>

                          <DetailCard title="Appointment" tone="bg-gradient-to-r from-orange-500 to-amber-500">
                            <DetailRow label="Appt ID" value={row.patient.id} />
                            <DetailRow label="Provider" value={row.provider} />
                            <DetailRow label="Type" value={row.visitType} />
                          </DetailCard>

                          <DetailCard title="Insurance" tone="bg-gradient-to-r from-emerald-500 to-teal-500">
                            <DetailRow label="Primary" value={row.insurance.primary} />
                            <DetailRow label="Member ID" value={row.insurance.primaryId} />
                            <DetailRow label="Secondary" value={row.insurance.secondary || 'None'} />
                            <DetailRow label="Status" value={row.insurance.status} />
                          </DetailCard>

                          <DetailCard title="Eligibility" tone="bg-gradient-to-r from-indigo-600 to-blue-600">
                            <DetailRow label="Co-Pay" value={`$${row.credits.toFixed(2)}`} />
                            <DetailRow label="Charges" value={`$${row.charges.toFixed(2)}`} />
                            <DetailRow label="Notes" value={row.notes || 'N/A'} />
                          </DetailCard>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/45 px-4 py-3">
        <div className="text-sm text-slate-300">
          {meta.total === 0 ? (
            'No results'
          ) : (
            <>
              Showing <span className="font-semibold text-white">{meta.from}</span> to <span className="font-semibold text-white">{meta.to}</span> of{' '}
              <span className="font-semibold text-white">{meta.total}</span> results
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(meta.current_page - 1)}
            disabled={meta.current_page <= 1}
            className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-300">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
            className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
