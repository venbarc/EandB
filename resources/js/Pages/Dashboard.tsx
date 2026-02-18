import React, { useState } from 'react';
import { Header } from '@/Components/Header';
import { StatsSection } from '@/Components/StatsSection';
import { Filters } from '@/Components/Filters';
import { AppointmentsTable } from '@/Components/AppointmentsTable';
import { UpdateRecordModal } from '@/Components/Modals';
import { Appointment, DashboardStats, FilterOptions, FilterState, PaginatedAppointments } from '@/types';

interface DashboardProps {
  stats: DashboardStats;
  appointments: PaginatedAppointments;
  filters: FilterState;
  filterOptions: FilterOptions;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, appointments, filters, filterOptions }) => {
  const [selectedRecord, setSelectedRecord] = useState<Appointment | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-700 pb-20 text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-2 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

      <Header filters={filters} />
      <main className="relative z-10 mx-auto w-full max-w-[1920px] space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <StatsSection stats={stats} />
        </section>
        <section>
          <Filters filters={filters} filterOptions={filterOptions} />
        </section>
        <section>
          <AppointmentsTable
            data={appointments.data}
            meta={appointments.meta}
            currentFilters={filters}
            onUpdateRecord={(appt) => { setSelectedRecord(appt); setIsUpdateModalOpen(true); }}
          />
        </section>
      </main>
      <UpdateRecordModal
        isOpen={isUpdateModalOpen}
        onClose={() => { setIsUpdateModalOpen(false); setSelectedRecord(null); }}
        record={selectedRecord}
      />
    </div>
  );
};

export default Dashboard;
