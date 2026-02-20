export interface Patient {
  id: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
}

export interface Insurance {
  primary: string;
  primaryId: string;
  secondary: string | null;
  status: string;
}

export interface Appointment {
  id: string;
  formattedId: string;
  patient: Patient;
  provider: string;
  date: string;
  time: string;
  status: string;
  confirmationMethod: string;
  authStatus: string;
  referralStatus: string;
  insurance: Insurance;
  visitType: string;
  paidAmount: number;
  pscCode: string;
  pscDescription: string;
  credits: number;
  deductible: number;
  oop: number;
  eligibilityStatus: string;
  charges: number;
  invoiceStatus: string;
  location: string;
  collectionStatus: string;
  providerCredentialed: boolean | null;
  collectedAmount: number | null;
  collectedMethod: string;
  collectedReceiptNo: string;
  notes: string;
  isSubmittedToPaDept: boolean;
  paSubmittedAt?: string | null;
}

export interface DashboardStats {
  totalAppointments: number;
  eligibleCount: number;
  notEligibleCount: number;
  verificationPendingCount: number;
  authCount: number;
  refCount: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginatedAppointments {
  data: Appointment[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export type FilterState = {
  dateFrom?: string;
  dateTo?: string;
  ampm?: string;
  patient?: string;
  insurances?: string[];
  provider?: string;
  status?: string;
  location?: string;
  auth?: string;
  referral?: string;
  eligibility?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
};

export interface FilterOptions {
  providers: string[];
  locations: string[];
  insurances: string[];
  statuses: string[];
}

export interface ImportDuplicate {
  patient_name: string;
  date_of_service: string;
  invoice_no: string | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  duplicates: ImportDuplicate[];
}
