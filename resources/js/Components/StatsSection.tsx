import React from 'react';
import { DashboardStats } from '@/types';
import { ArrowUpRight } from 'lucide-react';

interface StatsSectionProps {
  stats: DashboardStats;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  tone: string;
}> = ({ label, value, tone }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/55 p-4 shadow-[0_20px_40px_-26px_rgba(2,12,27,0.95)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-slate-900/70">
    <div className={`absolute left-0 top-0 h-1 w-full ${tone}`} />
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
    <p className="mt-1.5 text-3xl font-semibold tracking-tight text-white">{value}</p>
    <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-slate-500 transition group-hover:text-cyan-300" />
  </div>
);

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Appointments" value={stats.totalAppointments} tone="bg-gradient-to-r from-indigo-500 to-blue-500" />
        <StatCard label="Eligible" value={stats.eligibleCount} tone="bg-gradient-to-r from-emerald-500 to-teal-500" />
        <StatCard label="Not Eligible" value={stats.notEligibleCount} tone="bg-gradient-to-r from-rose-500 to-red-500" />
        <StatCard label="Verification Pending" value={stats.verificationPendingCount} tone="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Auth Count" value={stats.authCount} tone="bg-gradient-to-r from-cyan-500 to-blue-500" />
        <StatCard label="Ref Count" value={stats.refCount} tone="bg-gradient-to-r from-fuchsia-500 to-pink-500" />
      </div>
    </div>
  );
};
