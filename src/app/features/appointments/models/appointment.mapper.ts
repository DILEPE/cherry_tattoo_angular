import {
  Appointment,
  AppointmentApiRow,
  AppointmentFinancials,
  AppointmentStatus,
  AppointmentFilters,
} from './appointment.model';

function toFloat(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatCop(value: number): string {
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
  };
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

export function mapAppointment(raw: AppointmentApiRow): Appointment {
  const fin = mapFinancials(raw);
  const status = normalizeStatus(raw.status);
  return {
    id: raw.id,
    customerName: (raw.customer_name ?? '').trim() || '—',
    phone: (raw.phone ?? '').trim(),
    serviceType: (raw.service_type ?? '').trim() || '—',
    detail: (raw.detail ?? '').trim(),
    appointmentDate: raw.appointment_date ? new Date(raw.appointment_date) : null,
    status,
    statusLabel: raw.status?.trim() || 'Agendada',
    isPriority: Boolean(raw.is_priority),
    assignedUsername: (raw.assigned_username ?? '').trim(),
    financials: fin,
  };
}

export function filterAppointments(
  items: Appointment[],
  filters: AppointmentFilters,
): Appointment[] {
  const name = filters.nameSubstr.trim().toLowerCase();
  const service = filters.service;
  const status = filters.status;
  return items.filter((row) => {
    if (name && !row.customerName.toLowerCase().includes(name)) return false;
    if (service !== 'Todos' && row.serviceType !== service) return false;
    if (status !== 'Todos' && row.statusLabel.toLowerCase() !== status.toLowerCase()) {
      return false;
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
