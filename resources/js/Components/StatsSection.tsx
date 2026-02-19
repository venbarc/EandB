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
    className={`group relative w-full overflow-hidden rounded-2xl border bg-slate-900/55 p-4 shadow-[0_20px_40px_-26px_rgba(2,12,27,0.95)] backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-slate-900/70 active:scale-95 active:brightness-90 text-left cursor-pointer ${
      isActive ? 'border-white/40 ring-1 ring-white/20' : 'border-white/15'
    }`}
  >
    <div className={`absolute left-0 top-0 h-1 w-full ${tone}`} />
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
    <p className="mt-1.5 text-3xl font-semibold tracking-tight text-white">{value}</p>
    <ArrowUpRight className={`absolute bottom-3 right-3 h-4 w-4 transition ${isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-cyan-300'}`} />
  </button>
);

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
          tone="bg-gradient-to-r from-cyan-500 to-blue-500"
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
    </div>
  );
};
