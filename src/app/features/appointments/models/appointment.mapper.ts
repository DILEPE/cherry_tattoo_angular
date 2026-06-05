import {
  Appointment,
  AppointmentApiRow,
  AppointmentFinancials,
  AppointmentPayment,
  AppointmentReceipt,
  AppointmentStatus,
  AppointmentFilters,
} from './appointment.model';
import { appointmentRowDate } from './calendar.mapper';

function toFloat(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function formatCop(value: number): string {
  const amount = Math.round(value);
  return `COP $${amount.toLocaleString('es-CO').replace(/,/g, '.')}`;
}

function mapFinancials(raw: AppointmentApiRow): AppointmentFinancials {
  const deposit = Math.max(toFloat(raw.deposit), 0);
  const totalRaw = Math.max(toFloat(raw.total_amount), 0);
  const total = Math.max(totalRaw, deposit);
  const credit = Math.max(toFloat(raw.customer_credit), 0);
  const rawPb = raw.pending_balance;
  const pending =
    rawPb != null && rawPb !== ('' as unknown)
      ? Math.max(Math.round(toFloat(rawPb) * 100) / 100, 0)
      : Math.max(Math.round((total - deposit - credit) * 100) / 100, 0);
  return {
    total,
    deposit,
    pending,
    credit,
    totalFmt: formatCop(total),
    depositFmt: formatCop(deposit),
    pendingFmt: formatCop(pending),
    creditFmt: formatCop(credit),
  };
}

export function mapPayment(raw: Record<string, unknown>): AppointmentPayment {
  return {
    id: Number(raw['id'] ?? 0),
    appointmentId: Number(raw['appointment_id'] ?? raw['appointmentId'] ?? 0),
    amount: toFloat(raw['amount']),
    note: raw['note'] != null ? String(raw['note']) : null,
    paidOn: raw['paid_on'] != null ? String(raw['paid_on']) : null,
    createdAt: raw['created_at'] != null ? String(raw['created_at']) : null,
  };
}

export function mapReceipt(raw: Record<string, unknown>): AppointmentReceipt {
  const payId = raw['appointment_payment_id'];
  return {
    id: Number(raw['id'] ?? 0),
    appointmentId: Number(raw['appointment_id'] ?? raw['appointmentId'] ?? 0),
    appointmentPaymentId:
      payId != null && Number(payId) > 0 ? Number(payId) : null,
    kind: String(raw['kind'] ?? ''),
    amount: toFloat(raw['amount']),
    createdAt: raw['created_at'] != null ? String(raw['created_at']) : null,
  };
}

/** Valor en tabla de abonos (60.000) sin prefijo COP. */
export function formatAmountTable(value: number): string {
  return Math.round(value).toLocaleString('es-CO').replace(/,/g, '.');
}

export function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  const key = (status ?? 'agendada').trim().toLowerCase();
  const map: Record<string, AppointmentStatus> = {
    agendada: 'agendada',
    reprogramada: 'reprogramada',
    cancelada: 'cancelada',
    finalizada: 'finalizada',
  };
  return map[key] ?? 'default';
}

export function statusToPillVariant(
  status: AppointmentStatus,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'finalizada':
      return 'success';
    case 'reprogramada':
      return 'warning';
    case 'cancelada':
      return 'danger';
    case 'agendada':
      return 'info';
    default:
      return 'neutral';
  }
}

export function serviceToBadgeVariant(
  service: string,
): 'tattoo' | 'piercing' | 'limpieza' | 'cambio' | 'other' {
  const s = service.toLowerCase();
  if (s.includes('tatu')) return 'tattoo';
  if (s.includes('perfor') || s.includes('pierc')) return 'piercing';
  if (s.includes('limpie')) return 'limpieza';
  if (s.includes('cambio')) return 'cambio';
  return 'other';
}

function assignedStaffLabel(raw: AppointmentApiRow): string {
  const fn = (raw.assigned_first_name ?? '').trim();
  const ln = (raw.assigned_last_name ?? '').trim();
  if (fn || ln) return `${fn} ${ln}`.trim();
  const un = (raw.assigned_username ?? '').trim();
  return un || '—';
}

export function mapAppointment(raw: AppointmentApiRow): Appointment {
  const fin = mapFinancials(raw);
  const status = normalizeStatus(raw.status);
  const rawDate = raw.appointment_date ?? null;
  const apptDate = rawDate ? appointmentRowDate(rawDate) : null;
  const cid = raw.customer_id;
  return {
    id: raw.id,
    customerName: (raw.customer_name ?? '').trim() || '—',
    phone: (raw.phone ?? '').trim(),
    serviceType: (raw.service_type ?? '').trim() || '—',
    detail: (raw.detail ?? '').trim(),
    appointmentDate: apptDate,
    appointmentDateRaw: rawDate != null ? String(rawDate) : null,
    status,
    statusLabel: raw.status?.trim() || 'Agendada',
    isPriority: Boolean(raw.is_priority),
    assignedUsername: (raw.assigned_username ?? '').trim(),
    assignedLabel: assignedStaffLabel(raw),
    assignedPanelUserId:
      raw.assigned_panel_user_id != null && Number(raw.assigned_panel_user_id) > 0
        ? Number(raw.assigned_panel_user_id)
        : null,
    assignedStoreId:
      raw.assigned_store_id != null && Number(raw.assigned_store_id) > 0
        ? Number(raw.assigned_store_id)
        : null,
    customerId: cid != null && cid > 0 ? Number(cid) : null,
    hasSignedContract: Boolean(raw.has_signed_contract),
    contractPendingArtistSignature: Boolean(raw.contract_pending_artist_signature),
    createdAt: raw.created_at != null ? String(raw.created_at) : null,
    financials: fin,
  };
}

function parseFilterDate(iso: string): Date | null {
  const s = iso.trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function filterAppointments(
  items: Appointment[],
  filters: AppointmentFilters,
): Appointment[] {
  const name = filters.nameSubstr.trim().toLowerCase();
  const service = filters.service;
  const status = filters.status;
  const from = parseFilterDate(filters.fromDate);
  const to = parseFilterDate(filters.toDate);
  const storeId = filters.storeId ?? 0;
  return items.filter((row) => {
    if (name && !row.customerName.toLowerCase().includes(name)) return false;
    if (storeId > 0 && (row.assignedStoreId ?? 0) !== storeId) return false;
    if (service !== 'Todos' && row.serviceType !== service) return false;
    if (status !== 'Todos' && row.statusLabel.toLowerCase() !== status.toLowerCase()) {
      return false;
    }
    const d = row.appointmentDate;
    if (from && d) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (day < from) return false;
    }
    if (to && d) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (day > to) return false;
    }
    return true;
  });
}

export function uniqueServices(items: Appointment[]): string[] {
  const set = new Set<string>();
  for (const a of items) {
    if (a.serviceType && a.serviceType !== '—') set.add(a.serviceType);
  }
  return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))];
}
