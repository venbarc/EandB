import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Appointment, FilterState, PaginationMeta } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AppointmentsTableProps {
  data: Appointment[];
  meta: PaginationMeta;
  currentFilters: FilterState;
  onUpdateRecord: (appt: Appointment) => void;
  onUpdatePSC: (appt: Appointment) => void;
}

const DetailCard: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
  <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm h-full bg-white">
    <div className={`px-4 py-2 ${color} border-b border-gray-100`}>
      <h5 className="font-bold text-sm text-white">{title}</h5>
    </div>
    <div className="p-4 text-sm space-y-2">
      {children}
    </div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-start border-b border-gray-50 pb-1 last:border-0 last:pb-0">
    <span className="text-gray-500 text-xs font-medium">{label}:</span>
    <span className="text-gray-900 text-xs font-semibold text-right max-w-[60%]">{value}</span>
  </div>
);

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  data,
  meta,
  currentFilters,
  onUpdateRecord,
  onUpdatePSC,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const goToPage = (page: number) => {
    router.get('/', { ...currentFilters, page }, { preserveState: true, preserveScroll: false });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':   return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending':     return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled':   return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'No Show':     return 'bg-red-100 text-red-700 border-red-200';
      case 'Checked In':  return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'New':         return 'bg-purple-100 text-purple-700 border-purple-200';
      default:            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-3 py-3"></th>
              {[
                'Patient ID', 'Patient Name', 'Date of Birth', 'Provider',
                'Appt Date', 'Appt Status', 'Confirmation', 'Auth/Referral',
                'Primary Insurance', 'Visit Type', 'Paid', 'PSC', 'Actions'
              ].map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No appointments found matching your filters.
                </td>
              </tr>
            ) : data.map((row) => (
              <React.Fragment key={row.id}>
                {/* Main Row */}
                <tr className={`hover:bg-gray-50 transition-colors ${expandedId === row.id ? 'bg-gray-50' : ''}`}>
                  <td className="px-3 py-4 whitespace-nowrap cursor-pointer" onClick={() => toggleExpand(row.id)}>
                    <button className="text-gray-400 hover:text-brand-600 transition-colors">
                      {expandedId === row.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.patient.id}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-brand-700 hover:underline cursor-pointer">{row.patient.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.patient.dob}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{row.provider}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{row.date}</span>
                      <span className="text-xs text-gray-400">{row.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.confirmationMethod}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs">Auth: {row.authStatus}</span>
                      <span className="text-xs">Ref: {row.referralStatus}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-[150px]" title={row.insurance.primary}>
                    {row.insurance.primary}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.visitType}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {row.paidAmount > 0 ? `$${row.paidAmount.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.pscCode ? (
                      <span title={row.pscDescription} className="cursor-help">{row.pscCode}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateRecord(row)}
                        className="bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded hover:bg-gray-900 transition-colors shadow-sm flex items-center gap-1"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => onUpdatePSC(row)}
                        className="bg-white border border-gray-300 text-gray-700 text-xs px-2.5 py-1.5 rounded hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        PSC
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Detail Row */}
                {expandedId === row.id && (
                  <tr>
                    <td colSpan={14} className="p-0 bg-gray-50/50 block md:table-cell">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                        <DetailCard title="Patient Info" color="bg-brand-600">
                          <DetailRow label="Name"    value={row.patient.name} />
                          <DetailRow label="Phone"   value={row.patient.phone} />
                          <DetailRow label="Email"   value={row.patient.email} />
                          <DetailRow label="Address" value={row.patient.address} />
                        </DetailCard>

                        <DetailCard title="Appointment" color="bg-orange-500">
                          <DetailRow label="Appt ID"  value={row.patient.id} />
                          <DetailRow label="Provider"  value={row.provider} />
                          <DetailRow label="Type"      value={row.visitType} />
                          <DetailRow label="Notes"     value={row.notes || 'N/A'} />
                        </DetailCard>

                        <DetailCard title="Insurance" color="bg-emerald-500">
                          <DetailRow label="Primary"   value={row.insurance.primary} />
                          <DetailRow label="Member ID" value={row.insurance.primaryId} />
                          <DetailRow label="Secondary" value={row.insurance.secondary || 'None'} />
                          <DetailRow label="Status"    value={row.insurance.status} />
                        </DetailCard>

                        <DetailCard title="Eligibility & Financials" color="bg-blue-500">
                          <DetailRow label="Status"      value={row.eligibilityStatus} />
                          <DetailRow label="Deductible"  value={`$${row.deductible.toFixed(2)}`} />
                          <DetailRow label="Credits"     value={`$${row.credits.toFixed(2)}`} />
                          <DetailRow label="Charges"     value={`$${row.charges.toFixed(2)}`} />
                        </DetailCard>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {meta.total === 0 ? (
            'No results'
          ) : (
            <>Showing <span className="font-medium">{meta.from}</span> to <span className="font-medium">{meta.to}</span> of <span className="font-medium">{meta.total}</span> results</>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => goToPage(meta.current_page - 1)}
            disabled={meta.current_page <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            onClick={() => goToPage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
