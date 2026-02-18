import { Appointment, DashboardStats } from './types';

export const MOCK_STATS: DashboardStats = {
  totalAppointments: 563,
  eligibleCount: 142,
  notEligibleCount: 67,
  verificationPendingCount: 354,
  authCount: 89,
  refCount: 54,
};

const NAMES = ["Patricia Kristin", "Singleton Karol", "Visconti Liam", "Ghazljian Raymond", "Ingram Melina", "Heck Larry", "Bell Arthur", "Medina Alishia"];
const PROVIDERS = ["Najem Alvanji", "DecaBar Injection", "Trina Singleberry", "Matt Molloy", "Ryan Nokes"];
const INSURANCES = ["Health Plan of Nevada", "HP Enterprise Services", "KPN Medicaid", "Anthem BCBS", "Cigna Healthcare"];

export const generateMockAppointments = (count: number): Appointment[] => {
  return Array.from({ length: count }).map((_, i) => {
    const name = NAMES[i % NAMES.length];
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ')[1];

    return {
      id: `${127890 + i}`,
      patient: {
        id: `PT-${1000 + i}`,
        name: `${lastName}, ${firstName}`,
        dob: `04/06/${1960 + (i % 30)}`,
        phone: '(555) 123-4567',
        email: `${firstName.toLowerCase()}@example.com`,
        address: '123 Wellness Blvd, Las Vegas, NV 89101'
      },
      provider: PROVIDERS[i % PROVIDERS.length],
      date: '02/17/2026',
      time: ['09:15 AM', '11:30 AM', '02:45 PM', '04:15 PM'][i % 4],
      status: i % 5 === 0 ? 'Pending' : 'Confirmed',
      confirmationMethod: i % 3 === 0 ? 'Confirmed via Call' : 'Msg Left',
      authStatus: i % 4 === 0 ? 'Auth Required' : 'N/A',
      referralStatus: 'N/A',
      insurance: {
        primary: INSURANCES[i % INSURANCES.length],
        primaryId: `MBR${888000 + i}`,
        secondary: i % 6 === 0 ? 'Medicare' : null,
        status: 'Active'
      },
      visitType: 'PSYCH TELE FU',
      paidAmount: i % 10 === 0 ? 25.00 : 0,
      psc: 'N/A',
      credits: 0,
      deductible: 500,
      oop: 2500,
      eligibilityStatus: i % 2 === 0 ? 'Eligible' : 'Verification Needed'
    };
  });
};

export const MOCK_DATA = generateMockAppointments(20);
