import React from 'react';
import { router } from '@inertiajs/react';
import { DashboardStats, FilterState } from '@/types';
import { ArrowUpRight } from 'lucide-react';

interface StatsSectionProps {
  stats: DashboardStats;
  filters?: FilterState;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  tone: string;
  onClick: () => void;
  isActive: boolean;
}> = ({ label, value, tone, onClick, isActive }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative w-full overflow-hidden rounded-2xl border bg-white p-4 shadow-md transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95 active:brightness-95 text-left cursor-pointer ${
      isActive ? 'border-teal-400 ring-1 ring-teal-200/40' : 'border-slate-200'
    }`}
  >
    <div className={`absolute left-0 top-0 h-1 w-full ${tone}`} />
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-800">{value}</p>
    <ArrowUpRight className={`absolute bottom-3 right-3 h-4 w-4 transition ${isActive ? 'text-teal-500' : 'text-slate-400 group-hover:text-teal-500'}`} />
  </button>
);

const PSC_LEGEND = [
  { code: 'Eligibility Completed',     dot: 'bg-amber-400',   activeBg: 'bg-amber-100',   activeBorder: 'border-amber-400',   activeText: 'text-amber-700' },
  { code: 'Eligibility Not Found',     dot: 'bg-red-500',     activeBg: 'bg-red-100',     activeBorder: 'border-red-400',     activeText: 'text-red-700' },
  { code: 'No Collection Required',    dot: 'bg-orange-400',  activeBg: 'bg-orange-100',  activeBorder: 'border-orange-400',  activeText: 'text-orange-700' },
  { code: 'Provider Not Credentialed', dot: 'bg-cyan-400',    activeBg: 'bg-cyan-100',    activeBorder: 'border-cyan-400',    activeText: 'text-cyan-700' },
  { code: 'Payment Completed',         dot: 'bg-emerald-500', activeBg: 'bg-emerald-100', activeBorder: 'border-emerald-400', activeText: 'text-emerald-700' },
  { code: 'Self Pay',                  dot: 'bg-pink-500',    activeBg: 'bg-pink-100',    activeBorder: 'border-pink-400',    activeText: 'text-pink-700' },
] as const;

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, filters }) => {
  const navigate = (params: Record<string, string>) => {
    router.get('/', params, { preserveState: false });
  };

  const f = filters ?? {};
  const hasEligFilter = !!f.eligibility;
  const isAllActive = !hasEligFilter && !f.auth && !f.referral;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Appointments"
          value={stats.totalAppointments}
          tone="bg-gradient-to-r from-indigo-500 to-blue-500"
          onClick={() => navigate({})}
          isActive={isAllActive}
        />
        <StatCard
          label="Eligible"
          value={stats.eligibleCount}
          tone="bg-gradient-to-r from-emerald-500 to-teal-500"
          onClick={() => navigate({ eligibility: 'Eligible' })}
          isActive={f.eligibility === 'Eligible'}
        />
        <StatCard
          label="Not Eligible"
          value={stats.notEligibleCount}
          tone="bg-gradient-to-r from-rose-500 to-red-500"
          onClick={() => navigate({ eligibility: 'Not Eligible' })}
          isActive={f.eligibility === 'Not Eligible'}
        />
        <StatCard
          label="Verification Pending"
          value={stats.verificationPendingCount}
          tone="bg-gradient-to-r from-amber-500 to-orange-500"
          onClick={() => navigate({ eligibility: 'Verification Pending' })}
          isActive={f.eligibility === 'Verification Pending'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label="Auth Count"
          value={stats.authCount}
          tone="bg-gradient-to-r from-red-500 to-red-700"
          onClick={() => navigate({ auth: 'Auth Required' })}
          isActive={f.auth === 'Auth Required'}
        />
        <StatCard
          label="Ref Count"
          value={stats.refCount}
          tone="bg-gradient-to-r from-fuchsia-500 to-pink-500"
          onClick={() => navigate({ referral: 'Required' })}
          isActive={f.referral === 'Required'}
        />
      </div>

      {/* PSC Status Legend */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {PSC_LEGEND.map(({ code, dot, activeBg, activeBorder, activeText }) => {
          const isActive = f.pscCode === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => navigate(isActive ? {} : { pscCode: code })}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:-translate-y-0.5 active:scale-95 ${
                isActive
                  ? `${activeBg} ${activeBorder} ${activeText} shadow-sm`
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
              {code}
            </button>
          );
        })}
      </div>
    </div>
  );
};
