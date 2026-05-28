export type AppointmentStatus = 'agendada' | 'reprogramada' | 'cancelada' | 'finalizada' | 'default';

export interface AppointmentApiRow {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  service_type?: string | null;
  detail?: string | null;
  appointment_date?: string | null;
  deposit?: number | null;
  total_amount?: number | null;
  pending_balance?: number | null;
  customer_credit?: number | null;
  status?: string | null;
  is_priority?: boolean | null;
  assigned_panel_user_id?: number | null;
  assigned_username?: string | null;
  assigned_first_name?: string | null;
  assigned_last_name?: string | null;
  customer_id?: number | null;
  has_signed_contract?: boolean | null;
  created_at?: string | null;
}

export interface AppointmentFinancials {
  total: number;
  deposit: number;
  pending: number;
  credit: number;
  totalFmt: string;
  depositFmt: string;
  pendingFmt: string;
}

export interface Appointment {
  id: number;
  customerName: string;
  phone: string;
  serviceType: string;
  detail: string;
  appointmentDate: Date | null;
  /** ISO original de la API para extraer HH:MM. */
  appointmentDateRaw: string | null;
  status: AppointmentStatus;
  statusLabel: string;
  isPriority: boolean;
  assignedUsername: string;
  assignedLabel: string;
  customerId: number | null;
  hasSignedContract: boolean;
  createdAt: string | null;
  financials: AppointmentFinancials;
}

export interface AppointmentPayment {
  id: number;
  appointmentId: number;
  amount: number;
  note: string | null;
  paidOn: string | null;
  createdAt: string | null;
}

export interface AppointmentReceipt {
  id: number;
  appointmentId: number;
  kind: string;
  amount: number;
  createdAt: string | null;
}

export interface AppointmentFilters {
  nameSubstr: string;
  service: string;
  status: string;
}
