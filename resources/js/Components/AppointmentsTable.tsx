import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Appointment, FilterState, PaginationMeta } from '@/types';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Loader2 } from 'lucide-react';

interface AppointmentsTableProps {
  data: Appointment[];
  meta: PaginationMeta;
  currentFilters: FilterState;
  onUpdateRecord: (appt: Appointment) => void;
}

const DetailCard: React.FC<{ title: string; tone: string; children: React.ReactNode }> = ({ title, tone, children }) => (
  <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className={`border-b border-slate-100 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white ${tone}`}>
      {title}
    </div>
    <div className="space-y-2 p-3.5 text-sm">{children}</div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-1.5 text-xs last:border-0 last:pb-0">
    <span className="font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
    <span className="max-w-[62%] text-right font-medium text-slate-700">{value}</span>
  </div>
);

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  data,
  meta,
  currentFilters,
  onUpdateRecord,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingInsurance, setEditingInsurance] = useState<{ id: string; value: string } | null>(null);
  const [savingInsuranceId, setSavingInsuranceId] = useState<string | null>(null);
  const [editingSecondaryInsurance, setEditingSecondaryInsurance] = useState<{ id: string; value: string } | null>(null);
  const [savingSecondaryInsuranceId, setSavingSecondaryInsuranceId] = useState<string | null>(null);

  const handleInsuranceSave = (rowId: string) => {
    if (!editingInsurance || editingInsurance.id !== rowId) return;
    const value = editingInsurance.value.trim();
    setEditingInsurance(null);
    if (!value) return;
    setSavingInsuranceId(rowId);
    router.patch(`/appointments/${rowId}`, { primary_insurance: value }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setSavingInsuranceId(null),
    });
  };

  const handleSecondaryInsuranceSave = (rowId: string) => {
    if (!editingSecondaryInsurance || editingSecondaryInsurance.id !== rowId) return;
    const value = editingSecondaryInsurance.value.trim();
    setEditingSecondaryInsurance(null);
    setSavingSecondaryInsuranceId(rowId);
    router.patch(`/appointments/${rowId}`, { secondary_insurance: value }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setSavingSecondaryInsuranceId(null),
    });
  };

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
    if (currentFilters.sort !== sortKey) return <ArrowUpDown size={12} className="shrink-0 text-slate-400" />;
    return currentFilters.direction === 'asc'
      ? <ArrowUp size={12} className="shrink-0 text-teal-500" />
      : <ArrowDown size={12} className="shrink-0 text-teal-500" />;
  };

  const getEligibilityColor = (status: string) => {
    const key = status.toLowerCase();
    if (key === 'eligible') return 'border-emerald-400 bg-emerald-50 text-emerald-700';
    if (key === 'not eligible') return 'border-rose-400 bg-rose-50 text-rose-700';
    return 'border-amber-400 bg-amber-50 text-amber-700';
  };

  const getAuthColor = (status: string): string | null => {
    if (status === 'Auth Required') return 'border-red-500 bg-red-600 text-white shadow-md shadow-red-200';
    if (status === 'Auth Active') return 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-200';
    if (status === 'No Auth Required') return 'border-slate-400 bg-slate-500 text-white shadow-md shadow-slate-200';
    if (status === 'For Review') return 'border-amber-400 bg-amber-500 text-white shadow-md shadow-amber-200';
    return null;
  };

  const getRefColor = (status: string): string | null =>
    status === 'Required' ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700' : null;


  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
            <tr>
              <th className="w-8 px-3 py-3" />
              {([
                { label: 'Patient ID',           sortKey: 'patient_id' },
                { label: 'Patient Name',         sortKey: 'patient_name' },
                { label: 'Date of Birth',        sortKey: 'dob' },
                { label: 'Provider',             sortKey: 'provider' },
                { label: 'Appt Date',            sortKey: 'appt_date' },
                { label: 'Appt Reason',          sortKey: 'Appt_Reason' },
                { label: 'Auth/Referral',        sortKey: null },
                { label: 'E&B Status',           sortKey: null },
                { label: 'Primary Insurance',    sortKey: 'primary_insurance' },
                { label: 'Secondary Insurance',  sortKey: 'secondary_insurance' },
                { label: 'Insurance Type',       sortKey: null },
                { label: 'Visit Type',           sortKey: 'visit_type' },
                { label: 'Paid',                 sortKey: 'paid' },
                { label: 'Actions',              sortKey: null },
              ] as { label: string; sortKey: string | null }[]).map(({ label, sortKey }) => (
                <th key={label} className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                  {sortKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(sortKey)}
                      className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                    >
                      {label}
                      <SortIcon sortKey={sortKey} />
                    </button>
                  ) : label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-4 py-14 text-center text-sm font-medium text-slate-400">
                  No appointments found with the current filters.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className={`transition ${expandedId === row.id ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
                    <td className="cursor-pointer px-3 py-4" onClick={() => toggleExpand(row.id)}>
                      <button type="button" className="text-slate-400 transition hover:text-teal-500">
                        {expandedId === row.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </td>

                    <td className="px-2 py-4 text-sm text-slate-500 truncate">{row.patient.id || 'N/A'}</td>
                    <td className="px-2 py-4 text-sm font-semibold text-teal-600 truncate" title={row.patient.name}>{row.patient.name || 'N/A'}</td>
                    <td className="px-2 py-4 text-sm text-slate-500 truncate">{row.patient.dob || 'N/A'}</td>
                    <td className="px-2 py-4 text-sm text-slate-700 truncate" title={row.provider}>{row.provider || 'N/A'}</td>
                    <td className="px-2 py-4 text-sm text-slate-600">
                      <div className="flex flex-col">
                        <span>{row.date || ''}</span>
                        <span className="text-xs text-slate-400">{row.time || ''}</span>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-600" title={row.status || 'N/A'}>
                      {row.status ? (row.status.length > 18 ? row.status.slice(0, 18) + '…' : row.status) : 'N/A'}
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex flex-row items-center gap-1.5 flex-nowrap">
                        {getAuthColor(row.authStatus) ? (
                          <span className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-bold tracking-wide ${getAuthColor(row.authStatus)}`}>
                            {row.authStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">{row.authStatus || 'N/A'}</span>
                        )}
                        {getRefColor(row.referralStatus) ? (
                          <span className={`inline-block rounded-lg border px-3 py-1 text-xs font-bold tracking-wide ${getRefColor(row.referralStatus)}`}>
                            {row.referralStatus || 'N/A'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">{row.referralStatus || 'N/A'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span className={`block w-full text-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getEligibilityColor(row.eligibilityStatus)}`}>
                        {row.eligibilityStatus}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-700">
                      {editingInsurance?.id === row.id ? (
                        <input
                          autoFocus
                          value={editingInsurance.value}
                          onChange={(e) => setEditingInsurance({ id: row.id, value: e.target.value })}
                          onBlur={() => handleInsuranceSave(row.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInsuranceSave(row.id);
                            if (e.key === 'Escape') setEditingInsurance(null);
                          }}
                          className="w-full min-w-[120px] rounded-lg border border-teal-400 bg-white px-2 py-0.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingInsurance({ id: row.id, value: row.insurance.primary })}
                          className="group flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-slate-100"
                          title="Click to edit"
                        >
                          <span className="truncate">{row.insurance.primary || 'N/A'}</span>
                          {savingInsuranceId === row.id ? (
                            <Loader2 size={11} className="shrink-0 animate-spin text-cyan-400" />
                          ) : (
                            <Pencil size={11} className="shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-700">
                      {editingSecondaryInsurance?.id === row.id ? (
                        <input
                          autoFocus
                          value={editingSecondaryInsurance.value}
                          onChange={(e) => setEditingSecondaryInsurance({ id: row.id, value: e.target.value })}
                          onBlur={() => handleSecondaryInsuranceSave(row.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSecondaryInsuranceSave(row.id);
                            if (e.key === 'Escape') setEditingSecondaryInsurance(null);
                          }}
                          className="w-full min-w-[120px] rounded-lg border border-teal-400 bg-white px-2 py-0.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingSecondaryInsurance({ id: row.id, value: row.insurance.secondary ?? '' })}
                          className="group flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-slate-100"
                          title="Click to edit"
                        >
                          <span className="truncate">{row.insurance.secondary || 'N/A'}</span>
                          {savingSecondaryInsuranceId === row.id ? (
                            <Loader2 size={11} className="shrink-0 animate-spin text-cyan-400" />
                          ) : (
                            <Pencil size={11} className="shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-600 truncate" title={row.insuranceType || 'N/A'}>{row.insuranceType || 'N/A'}</td>
                    <td className="px-2 py-4 text-sm text-slate-600 truncate" title={row.visitType || 'N/A'}>{row.visitType || 'N/A'}</td>
                    <td className="px-2 py-4 text-sm font-semibold text-slate-700">
                      {row.paidAmount > 0 ? `$${row.paidAmount.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateRecord(row)}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={16} className="bg-slate-50 p-0">
                        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
                          <DetailCard title="Patient Info" tone="bg-gradient-to-r from-cyan-600 to-blue-700">
                            <DetailRow label="Name" value={row.patient.name || 'N/A'} />
                            <DetailRow label="Phone" value={row.patient.phone || 'N/A'} />
                            <DetailRow label="Email" value={row.patient.email || 'N/A'} />
                            <DetailRow label="Address" value={row.patient.address || 'N/A'} />
                          </DetailCard>

                          <DetailCard title="Appointment" tone="bg-gradient-to-r from-orange-500 to-amber-500">
                            <DetailRow label="Appt ID" value={row.patient.id || 'N/A'} />
                            <DetailRow label="Provider" value={row.provider || 'N/A'} />
                            <DetailRow label="Type" value={row.visitType || 'N/A'} />
                            <DetailRow label="Location" value={row.location || 'N/A'} />
                          </DetailCard>

                          <DetailCard title="Auth / Referral" tone="bg-gradient-to-r from-violet-600 to-purple-700">
                            <DetailRow label="Auth" value={row.authStatus} />
                            <DetailRow label="Authorization #" value={row.authorizationNumber || 'N/A'} />
                            <DetailRow label="Expiration Date" value={row.expirationDate || 'N/A'} />
                            <DetailRow label="Referral" value={row.referralStatus} />
                            <DetailRow label="Credentialed" value={row.providerCredentialed === true ? 'Yes' : row.providerCredentialed === false ? 'No' : 'Unknown'} />
                            <DetailRow label="Collection" value={row.collectionStatus || 'N/A'} />
                            <DetailRow label="Collected" value={row.collectedAmount != null ? `$${row.collectedAmount.toFixed(2)}` : 'N/A'} />
                            <DetailRow label="Method" value={row.collectedMethod || 'N/A'} />
                            <DetailRow label="Receipt No" value={row.collectedReceiptNo || 'N/A'} />
                            <DetailRow label="PSC Code" value={row.pscCode || 'N/A'} />
                            <DetailRow label="Invoice Status" value={row.invoiceStatus || 'N/A'} />
                            <DetailRow label="Deductible" value={`$${row.deductible.toFixed(2)}`} />
                            <DetailRow label="OOP" value={`$${row.oop.toFixed(2)}`} />
                          </DetailCard>

                          <DetailCard title="Insurance" tone="bg-gradient-to-r from-emerald-500 to-teal-500">
                            <DetailRow label="Primary" value={row.insurance.primary || 'N/A'} />
                            <DetailRow label="Member ID" value={row.insurance.primaryId || 'N/A'} />
                            <DetailRow label="Secondary" value={row.insurance.secondary || 'N/A'} />
                            <DetailRow label="Status" value={row.insurance.status || 'N/A'} />
                          </DetailCard>

                          <DetailCard title="Eligibility" tone="bg-gradient-to-r from-indigo-600 to-blue-600">
                            <DetailRow label="E&B Status" value={row.eligibilityStatus || 'N/A'} />
                            <DetailRow label="Authorization #" value={row.authorizationNumber || 'N/A'} />
                            <DetailRow label="Expiration Date" value={row.expirationDate || 'N/A'} />
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

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm text-slate-600">
          {meta.total === 0 ? (
            'No results'
          ) : (
            <>
              Showing <span className="font-semibold text-slate-800">{meta.from}</span> to <span className="font-semibold text-slate-800">{meta.to}</span> of{' '}
              <span className="font-semibold text-slate-800">{meta.total}</span> results
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(meta.current_page - 1)}
            disabled={meta.current_page <= 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-600">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
