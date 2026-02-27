import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Appointment, FilterState, PaginationMeta } from '@/types';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Loader2, Columns3, Maximize2 } from 'lucide-react';

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

type ViewMode = 'compact' | 'expanded';

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  data,
  meta,
  currentFilters,
  onUpdateRecord,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
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
    const size = viewMode === 'compact' ? 10 : 12;
    if (currentFilters.sort !== sortKey) return <ArrowUpDown size={size} className="shrink-0 text-slate-400" />;
    return currentFilters.direction === 'asc'
      ? <ArrowUp size={size} className="shrink-0 text-teal-500" />
      : <ArrowDown size={size} className="shrink-0 text-teal-500" />;
  };

  const getEligibilityColor = (status: string) => {
    const key = status.toLowerCase();
    if (key === 'active') return 'border-emerald-400 bg-emerald-50 text-emerald-700';
    if (key === 'inactive') return 'border-rose-400 bg-rose-50 text-rose-700';
    if (key === 'self pay') return 'border-amber-400 bg-amber-50 text-amber-700';
    return 'border-slate-400 bg-slate-50 text-slate-700';
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

  /* ---------- Insurance inline-edit cell (shared) ---------- */
  const InsuranceCell: React.FC<{
    row: Appointment;
    type: 'primary' | 'secondary';
    textSize: string;
    iconSize: number;
  }> = ({ row, type, textSize, iconSize }) => {
    const isPrimary = type === 'primary';
    const editing = isPrimary ? editingInsurance : editingSecondaryInsurance;
    const setEditing = isPrimary ? setEditingInsurance : setEditingSecondaryInsurance;
    const handleSave = isPrimary ? handleInsuranceSave : handleSecondaryInsuranceSave;
    const savingId = isPrimary ? savingInsuranceId : savingSecondaryInsuranceId;
    const value = isPrimary ? row.insurance.primary : (row.insurance.secondary ?? '');

    if (editing?.id === row.id) {
      return (
        <input
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing({ id: row.id, value: e.target.value })}
          onBlur={() => handleSave(row.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave(row.id);
            if (e.key === 'Escape') setEditing(null);
          }}
          className={`w-full rounded border border-teal-400 bg-white px-1 py-0.5 ${textSize} text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400`}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => setEditing({ id: row.id, value })}
        className="group flex items-center gap-0.5 rounded px-0.5 text-left transition hover:bg-slate-100"
        title={value || 'Click to edit'}
      >
        <span className={textSize}>{value || 'N/A'}</span>
        {savingId === row.id ? (
          <Loader2 size={iconSize} className="shrink-0 animate-spin text-cyan-400" />
        ) : (
          <Pencil size={iconSize} className="shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
        )}
      </button>
    );
  };

  /* ---------- Auth/Referral badges (shared) ---------- */
  const AuthRefBadges: React.FC<{ row: Appointment; badgeSize: string }> = ({ row, badgeSize }) => (
    <div className="flex flex-col gap-0.5">
      {getAuthColor(row.authStatus) ? (
        <span className={`inline-block rounded border px-1 py-0.5 ${badgeSize} font-bold leading-none whitespace-nowrap ${getAuthColor(row.authStatus)}`}>
          {row.authStatus}
        </span>
      ) : (
        <span className={`${badgeSize} text-slate-400 whitespace-nowrap`}>{row.authStatus || 'N/A'}</span>
      )}
      {getRefColor(row.referralStatus) ? (
        <span className={`inline-block rounded border px-1 py-0.5 ${badgeSize} font-bold leading-none whitespace-nowrap ${getRefColor(row.referralStatus)}`}>
          {row.referralStatus}
        </span>
      ) : (
        <span className={`${badgeSize} text-slate-400 whitespace-nowrap`}>{row.referralStatus || 'N/A'}</span>
      )}
    </div>
  );

  /* ---------- Expanded detail row (shared) ---------- */
  const ExpandedDetailRow: React.FC<{ row: Appointment; colSpan: number }> = ({ row, colSpan }) => (
    <tr>
      <td colSpan={colSpan} className="bg-slate-50 p-0">
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
  );

  /* ================================================================
   *  COMPACT VIEW — fits on screen, no horizontal scroll
   * ================================================================ */
  const compactThCls = 'px-1.5 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap';
  const compactTd = 'px-1.5 py-1.5 text-[11px] text-slate-600';
  const compactTdNowrap = 'px-1.5 py-1.5 text-[11px] text-slate-600 whitespace-nowrap';

  const renderCompactTable = () => (
    <table className="w-full">
      <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
        <tr>
          <th className="w-6 px-1 py-2" />
          {([
            { label: 'Pt ID',         sortKey: 'patient_id' },
            { label: 'Patient Name',  sortKey: 'patient_name' },
            { label: 'DOB',           sortKey: 'dob' },
            { label: 'Provider',      sortKey: 'provider' },
            { label: 'Appt Date',     sortKey: 'appt_date' },
            { label: 'Reason',        sortKey: 'Appt_Reason' },
            { label: 'Location',      sortKey: null },
            { label: 'Auth/Ref',      sortKey: null },
            { label: 'Auth #',        sortKey: null },
            { label: 'E&B Status',    sortKey: null },
            { label: 'Cred.',         sortKey: null },
            { label: 'Primary Ins',   sortKey: 'primary_insurance' },
            { label: 'Secondary Ins', sortKey: 'secondary_insurance' },
            { label: 'Ins Type',      sortKey: null },
            { label: 'Collection',    sortKey: null },
            { label: 'Visit Type',    sortKey: 'visit_type' },
            { label: 'Visits (S/T/R)',sortKey: 'scheduled_visits' },
            { label: 'Exp Date',      sortKey: 'expiration_date' },
            { label: 'CoPay/Ded/OOP', sortKey: null },
            { label: 'Paid',          sortKey: 'paid' },
            { label: 'Notes',         sortKey: null },
            { label: '',              sortKey: null },
          ] as { label: string; sortKey: string | null }[]).map(({ label, sortKey }) => (
            <th key={label || 'actions'} className={compactThCls}>
              {sortKey ? (
                <button type="button" onClick={() => handleSort(sortKey)} className="flex items-center gap-0.5 hover:text-teal-600 transition-colors">
                  {label} <SortIcon sortKey={sortKey} />
                </button>
              ) : label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {data.length === 0 ? (
          <tr><td colSpan={23} className="px-4 py-14 text-center text-[11px] font-medium text-slate-400">No appointments found with the current filters.</td></tr>
        ) : data.map((row) => (
          <React.Fragment key={row.id}>
            <tr className={`transition ${expandedId === row.id ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
              <td className="cursor-pointer px-1 py-1.5 w-6" onClick={() => toggleExpand(row.id)}>
                <button type="button" className="text-slate-400 transition hover:text-teal-500">
                  {expandedId === row.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </td>
              <td className={compactTdNowrap}>{row.patient.id || 'N/A'}</td>
              <td className={`${compactTd} font-semibold text-teal-600`}>{row.patient.name || 'N/A'}</td>
              <td className={compactTdNowrap}>{row.patient.dob || 'N/A'}</td>
              <td className={compactTd}>{row.provider || 'N/A'}</td>
              <td className={compactTdNowrap}>
                <div className="leading-tight">
                  <div>{row.date || ''}</div>
                  <div className="text-[9px] text-slate-400">{row.time || ''}</div>
                </div>
              </td>
              <td className={compactTd}>{row.status || 'N/A'}</td>
              <td className={compactTd}>{row.location || 'N/A'}</td>
              <td className="px-1.5 py-1.5"><AuthRefBadges row={row} badgeSize="text-[9px]" /></td>
              <td className={compactTdNowrap}>{row.authorizationNumber || 'N/A'}</td>
              <td className="px-1.5 py-1.5">
                <span className={`block text-center whitespace-nowrap rounded-full border px-1 py-0.5 text-[9px] font-semibold ${getEligibilityColor(row.eligibilityStatus)}`}>
                  {row.eligibilityStatus}
                </span>
              </td>
              <td className={compactTdNowrap}>
                {row.providerCredentialed === true ? (
                  <span className="inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">Yes</span>
                ) : row.providerCredentialed === false ? (
                  <span className="inline-block rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">No</span>
                ) : <span className="text-[9px] text-slate-400">N/A</span>}
              </td>
              <td className={compactTd}><InsuranceCell row={row} type="primary" textSize="text-[11px]" iconSize={9} /></td>
              <td className={compactTd}><InsuranceCell row={row} type="secondary" textSize="text-[11px]" iconSize={9} /></td>
              <td className={compactTd}>{row.insuranceType || 'N/A'}</td>
              <td className={compactTd}>{row.collectionStatus || 'N/A'}</td>
              <td className={compactTd}>{row.visitType || 'N/A'}</td>
              <td className={`${compactTdNowrap} text-center`}>
                {row.scheduledVisits ?? 'N/A'}/{row.totalVisits ?? 'N/A'}/{row.remainingVisits ?? 'N/A'}
              </td>
              <td className={compactTdNowrap}>{row.expirationDate || 'N/A'}</td>
              <td className={compactTdNowrap}>
                <div className="leading-tight text-[10px]">
                  <div>{row.credits > 0 ? `$${row.credits.toFixed(2)}` : 'N/A'}</div>
                  <div>{row.deductible > 0 ? `$${row.deductible.toFixed(2)}` : 'N/A'}</div>
                  <div>{row.oop > 0 ? `$${row.oop.toFixed(2)}` : 'N/A'}</div>
                </div>
              </td>
              <td className={`${compactTdNowrap} font-semibold text-slate-700`}>
                {row.paidAmount > 0 ? `$${row.paidAmount.toFixed(2)}` : 'N/A'}
              </td>
              <td className={compactTd} title={row.notes || ''}>
                <span className="line-clamp-2 text-[10px]">{row.notes || 'N/A'}</span>
              </td>
              <td className="px-1.5 py-1.5">
                <button type="button" onClick={() => onUpdateRecord(row)} className="rounded bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-teal-700 whitespace-nowrap">
                  Update
                </button>
              </td>
            </tr>
            {expandedId === row.id && <ExpandedDetailRow row={row} colSpan={23} />}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  /* ================================================================
   *  EXPANDED VIEW — full details, horizontal scroll
   * ================================================================ */
  const expThCls = 'px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600 whitespace-nowrap';
  const expTd = 'px-2 py-3 text-sm text-slate-600 whitespace-nowrap';

  const renderExpandedTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[2800px]">
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
              { label: 'Location',             sortKey: null },
              { label: 'Auth/Referral',        sortKey: null },
              { label: 'Authorization #',      sortKey: null },
              { label: 'E&B Status',           sortKey: null },
              { label: 'Provider Cred.',       sortKey: null },
              { label: 'Primary Insurance',    sortKey: 'primary_insurance' },
              { label: 'Secondary Insurance',  sortKey: 'secondary_insurance' },
              { label: 'Insurance Type',       sortKey: null },
              { label: 'Collection Status',    sortKey: null },
              { label: 'Visit Type',           sortKey: 'visit_type' },
              { label: 'Scheduled Visits',     sortKey: 'scheduled_visits' },
              { label: 'Total Visits',         sortKey: 'total_visits' },
              { label: 'Remaining Visits',     sortKey: null },
              { label: 'Exp. Date',            sortKey: 'expiration_date' },
              { label: 'Co-Pay',               sortKey: null },
              { label: 'Deductible',           sortKey: null },
              { label: 'OOP',                  sortKey: null },
              { label: 'Paid',                 sortKey: 'paid' },
              { label: 'Notes',                sortKey: null },
              { label: 'Actions',              sortKey: null },
            ] as { label: string; sortKey: string | null }[]).map(({ label, sortKey }) => (
              <th key={label} className={expThCls}>
                {sortKey ? (
                  <button type="button" onClick={() => handleSort(sortKey)} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    {label} <SortIcon sortKey={sortKey} />
                  </button>
                ) : label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length === 0 ? (
            <tr><td colSpan={27} className="px-4 py-14 text-center text-sm font-medium text-slate-400">No appointments found with the current filters.</td></tr>
          ) : data.map((row) => (
            <React.Fragment key={row.id}>
              <tr className={`transition ${expandedId === row.id ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
                <td className="cursor-pointer px-3 py-3" onClick={() => toggleExpand(row.id)}>
                  <button type="button" className="text-slate-400 transition hover:text-teal-500">
                    {expandedId === row.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </td>
                <td className={expTd}>{row.patient.id || 'N/A'}</td>
                <td className={`${expTd} font-semibold text-teal-600`}>{row.patient.name || 'N/A'}</td>
                <td className={expTd}>{row.patient.dob || 'N/A'}</td>
                <td className={expTd}>{row.provider || 'N/A'}</td>
                <td className={expTd}>
                  <div className="flex flex-col">
                    <span>{row.date || ''}</span>
                    <span className="text-xs text-slate-400">{row.time || ''}</span>
                  </div>
                </td>
                <td className={expTd}>{row.status || 'N/A'}</td>
                <td className={expTd}>{row.location || 'N/A'}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-row items-center gap-1.5 flex-nowrap">
                    {getAuthColor(row.authStatus) ? (
                      <span className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-bold tracking-wide ${getAuthColor(row.authStatus)}`}>{row.authStatus}</span>
                    ) : (
                      <span className="text-xs text-slate-400">{row.authStatus || 'N/A'}</span>
                    )}
                    {getRefColor(row.referralStatus) ? (
                      <span className={`inline-block rounded-lg border px-3 py-1 text-xs font-bold tracking-wide ${getRefColor(row.referralStatus)}`}>{row.referralStatus || 'N/A'}</span>
                    ) : (
                      <span className="text-xs text-slate-400">{row.referralStatus || 'N/A'}</span>
                    )}
                  </div>
                </td>
                <td className={expTd}>{row.authorizationNumber || 'N/A'}</td>
                <td className="px-2 py-3">
                  <span className={`block w-full text-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getEligibilityColor(row.eligibilityStatus)}`}>
                    {row.eligibilityStatus}
                  </span>
                </td>
                <td className={expTd}>
                  {row.providerCredentialed === true ? (
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Yes</span>
                  ) : row.providerCredentialed === false ? (
                    <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">No</span>
                  ) : 'N/A'}
                </td>
                <td className={expTd}><InsuranceCell row={row} type="primary" textSize="text-sm" iconSize={11} /></td>
                <td className={expTd}><InsuranceCell row={row} type="secondary" textSize="text-sm" iconSize={11} /></td>
                <td className={expTd}>{row.insuranceType || 'N/A'}</td>
                <td className={expTd}>{row.collectionStatus || 'N/A'}</td>
                <td className={expTd}>{row.visitType || 'N/A'}</td>
                <td className={`${expTd} text-center`}>{row.scheduledVisits ?? 'N/A'}</td>
                <td className={`${expTd} text-center`}>{row.totalVisits ?? 'N/A'}</td>
                <td className={`${expTd} text-center`}>{row.remainingVisits ?? 'N/A'}</td>
                <td className={expTd}>{row.expirationDate || 'N/A'}</td>
                <td className={expTd}>{row.credits > 0 ? `$${row.credits.toFixed(2)}` : 'N/A'}</td>
                <td className={expTd}>{row.deductible > 0 ? `$${row.deductible.toFixed(2)}` : 'N/A'}</td>
                <td className={expTd}>{row.oop > 0 ? `$${row.oop.toFixed(2)}` : 'N/A'}</td>
                <td className={`${expTd} font-semibold text-slate-700`}>
                  {row.paidAmount > 0 ? `$${row.paidAmount.toFixed(2)}` : 'N/A'}
                </td>
                <td className="px-2 py-3 text-sm text-slate-500 max-w-[250px]" title={row.notes || ''}>
                  {row.notes || 'N/A'}
                </td>
                <td className="px-2 py-3">
                  <button type="button" onClick={() => onUpdateRecord(row)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700">
                    Update
                  </button>
                </td>
              </tr>
              {expandedId === row.id && <ExpandedDetailRow row={row} colSpan={27} />}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ================================================================
   *  MAIN RENDER
   * ================================================================ */
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Toggle bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        <span className="text-xs font-medium text-slate-500">
          {viewMode === 'compact' ? 'Compact View' : 'Expanded View'}
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              viewMode === 'compact'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Columns3 size={12} /> Compact
          </button>
          <button
            type="button"
            onClick={() => setViewMode('expanded')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              viewMode === 'expanded'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Maximize2 size={12} /> Expanded
          </button>
        </div>
      </div>

      {/* Table content */}
      {viewMode === 'compact' ? renderCompactTable() : renderExpandedTable()}

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">
        <div className="text-xs text-slate-600">
          {meta.total === 0 ? 'No results' : (
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
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-600">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
