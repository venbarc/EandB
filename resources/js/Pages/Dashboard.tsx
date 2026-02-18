import React, { useState } from 'react';
import { Header } from '@/Components/Header';
import { StatsSection } from '@/Components/StatsSection';
import { Filters } from '@/Components/Filters';
import { AppointmentsTable } from '@/Components/AppointmentsTable';
import { UpdateRecordModal, UpdatePSCModal } from '@/Components/Modals';
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
  const [isPSCModalOpen, setIsPSCModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header filters={filters} />
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            onUpdatePSC={(appt) => { setSelectedRecord(appt); setIsPSCModalOpen(true); }}
          />
        </section>
      </main>
      <UpdateRecordModal
        isOpen={isUpdateModalOpen}
        onClose={() => { setIsUpdateModalOpen(false); setSelectedRecord(null); }}
        record={selectedRecord}
      />
      <UpdatePSCModal
        isOpen={isPSCModalOpen}
        onClose={() => { setIsPSCModalOpen(false); setSelectedRecord(null); }}
        record={selectedRecord}
      />
    </div>
  );
};

export default Dashboard;
