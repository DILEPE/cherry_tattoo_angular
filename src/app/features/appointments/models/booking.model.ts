export const MIN_APPOINTMENT_TOTAL_COP = 50_000;
export const CUSTOMER_BIRTH_PENDING_ISO = '2001-07-13';

export type BookingWorkKind =
  | 'piercing'
  | 'limpieza_piercing'
  | 'cambio_piercing'
  | 'tatuaje';

export type ScheduleKind = 'tattoo' | 'piercing';

export interface BookingWorkKindMeta {
  label: string;
  serviceToken: string;
  detailTag: string;
}

export const BOOKING_WORK_KIND_ORDER: BookingWorkKind[] = [
  'piercing',
  'limpieza_piercing',
  'cambio_piercing',
  'tatuaje',
];

export const BOOKING_WORK_KIND_META: Record<BookingWorkKind, BookingWorkKindMeta> = {
  piercing: {
    label: 'Piercing (colocación)',
    serviceToken: 'piercing',
    detailTag: '[Piercing]',
  },
  limpieza_piercing: {
    label: 'Limpieza (piercing)',
    serviceToken: 'piercing',
    detailTag: '[Limpieza piercing]',
  },
  cambio_piercing: {
    label: 'Cambio de piercing',
    serviceToken: 'piercing',
    detailTag: '[Cambio piercing]',
  },
  tatuaje: {
    label: 'Tatuaje (sesión)',
    serviceToken: 'tattoo',
    detailTag: '[Tatuaje]',
  },
};

export interface PanelStaffOption {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  label: string;
}

export type { CustomerSnapshot } from '../../customers/models/customer.model';

export interface AppointmentCreatePayload {
  name: string;
  phone: string;
  service: string;
  date: string;
  detail: string | null;
  deposit: number;
  total_amount: number;
  pending_balance: number;
  is_priority: boolean;
  assigned_panel_user_id: number;
  customer_id?: number;
  customer?: Record<string, unknown>;
}
