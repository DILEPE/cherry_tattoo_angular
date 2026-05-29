import { appointmentRowDate, appointmentTimeHm } from './calendar.mapper';

export type AppointmentSearchField = 'name' | 'receipt' | 'document';

export const APPOINTMENT_SEARCH_FIELDS: Record<AppointmentSearchField, string> = {
  name: 'Nombre',
  receipt: 'Número de recibo',
  document: 'Número de documento',
};

export const APPOINTMENT_SEARCH_PAGE_SIZE = 10;

export interface AppointmentSearchHit {
  id: number;
  customer_name?: string | null;
  appointment_date?: string | null;
  receipt_label?: string | null;
  assigned_username?: string | null;
  assigned_first_name?: string | null;
  assigned_last_name?: string | null;
  assigned_panel_user_id?: number | null;
}

export interface AppointmentSearchResponse {
  items: AppointmentSearchHit[];
  total: number;
  limit: number;
  offset: number;
}

export function searchHitArtistLabel(hit: AppointmentSearchHit): string {
  const fn = (hit.assigned_first_name ?? '').trim();
  const ln = (hit.assigned_last_name ?? '').trim();
  const name = `${fn} ${ln}`.trim();
  if (name) return name;
  const un = (hit.assigned_username ?? '').trim();
  if (un) return `@${un}`;
  return 'Sin asignar';
}

export function formatSearchHitDatetime(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = appointmentRowDate(raw);
  if (d.getFullYear() === 1990) return '—';
  const hm = appointmentTimeHm(raw);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return hm !== '—' ? `${date} ${hm}` : date;
}
