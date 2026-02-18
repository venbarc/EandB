import React from 'react';
import { DashboardStats } from '@/types';

interface StatsSectionProps {
  stats: DashboardStats;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  color: string;
  subColor: string;
}> = ({ label, value, color, subColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold text-gray-900 group-hover:scale-105 transition-transform origin-left`}>{value}</p>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full ${color} ring-1 ring-inset ring-black/10`}></span>
    <span className="text-xs text-gray-600 font-medium">{label}</span>
  </div>
);

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Appointments" value={stats.totalAppointments} color="bg-indigo-500" subColor="text-indigo-600" />
        <StatCard label="Eligibility Completed" value={stats.eligibilityCompleted} color="bg-emerald-500" subColor="text-emerald-600" />
        <StatCard label="Payments Completed" value={stats.paymentsCompleted} color="bg-blue-500" subColor="text-blue-600" />
        <StatCard label="Total Amount" value={formatter.format(stats.totalAmount)} color="bg-gray-500" subColor="text-gray-600" />
        <StatCard label="Total Collections" value={formatter.format(stats.totalCollections)} color="bg-amber-500" subColor="text-amber-600" />
        <StatCard label="Total Unpaid" value={formatter.format(stats.totalUnpaid)} color="bg-rose-500" subColor="text-rose-600" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm items-center">
        <span className="text-xs font-bold text-gray-400 uppercase mr-2">Legend:</span>
        <LegendItem color="bg-emerald-400" label="Eligibility Completed" />
        <LegendItem color="bg-rose-400" label="Eligibility Not Found" />
        <LegendItem color="bg-orange-400" label="No Collection Required" />
        <LegendItem color="bg-sky-400" label="Provider Not Credentialed" />
        <LegendItem color="bg-blue-500" label="Payment Completed" />
        <LegendItem color="bg-fuchsia-400" label="Self Pay" />
      </div>
    </div>
  );
};
