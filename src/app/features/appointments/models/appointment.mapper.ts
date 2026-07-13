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
import { mergeDesignObsPlain } from './appointment-detail-text.mapper';
import { inferWorkKindFromAppointment } from './booking.mapper';
import {
  BookingWorkKind,
  isPiercingServiceFilter,
  isPiercingWorkKindFilter,
} from './booking.model';
import {
  isPiercingAnatomyFilter,
  resolvePiercingTypeCanonical,
} from './piercing-type-catalog';

function toFloat(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function formatCop(value: number): string {
  const amount = Math.round(value);
  return `COP $${amount.toLocaleString('es-CO').replace(/,/g, '.')}`;
}

/** COP visual en miles (50000 → COP $50). Entrada/guardado siguen en pesos. */
export function formatCopAbono(value: number): string {
  return `COP $${Math.round(Math.max(value, 0) / 1000)}`;
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
    totalFmt: formatCopAbono(total),
    depositFmt: formatCopAbono(deposit),
    pendingFmt: formatCopAbono(pending),
    creditFmt: formatCopAbono(credit),
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
    isVerified: Boolean(raw['is_verified'] ?? raw['isVerified'] ?? false),
    verifiedAt:
      raw['verified_at'] != null
        ? String(raw['verified_at'])
        : raw['verifiedAt'] != null
          ? String(raw['verifiedAt'])
          : null,
    verifiedBy: (() => {
      const v = raw['verified_by'] ?? raw['verifiedBy'];
      return v != null && Number(v) > 0 ? Number(v) : null;
    })(),
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

/** Valor en tabla de abonos: visual en miles (50000 → 50). */
export function formatAmountTable(value: number): string {
  return String(Math.round(Math.max(value, 0) / 1000));
}

/** Convierte miles a COP (50 → 50000). */
export function milesToCop(miles: number): number {
  return Math.round(Math.max(Number(miles) || 0, 0) * 1000);
}

/** Convierte COP a miles (50000 → 50). */
export function copToMiles(value: number): number {
  return Math.round(Math.max(value, 0) / 1000);
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

function pickStr(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    const s = (v ?? '').trim();
    if (s) return s;
  }
  return '';
}

/**
 * Devuelve el detalle de la cita. Si `raw.detail` viene vacío, lo reconstruye
 * a partir de los campos de diseño y observaciones que pueda enviar la API.
 */
function resolveDetail(raw: AppointmentApiRow): string {
  const detail = (raw.detail ?? '').trim();
  if (detail) return detail;
  const design = pickStr(
    raw.design_description,
    raw.designDescription,
    raw.descripcion_diseno,
    raw.description,
  );
  const observations = pickStr(raw.observations, raw.observaciones, raw.notes);
  return mergeDesignObsPlain(design, observations);
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
    detail: resolveDetail(raw),
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
  piercingTypeLabels: Readonly<Record<number, string>> = {},
): Appointment[] {
  const name = filters.nameSubstr.trim().toLowerCase();
  const service = filters.service;
  const status = filters.status;
  const from = parseFilterDate(filters.fromDate);
  const to = parseFilterDate(filters.toDate);
  const storeId = filters.storeId ?? 0;
  const piercingKind = (filters.piercingWorkKind || 'Todos').trim();
  return items.filter((row) => {
    if (name && !row.customerName.toLowerCase().includes(name)) return false;
    if (storeId > 0 && (row.assignedStoreId ?? 0) !== storeId) return false;
    if (service !== 'Todos') {
      if (isPiercingServiceFilter(service)) {
        const kind = inferWorkKindFromAppointment(row);
        const piercingFamily =
          kind === 'piercing' ||
          kind === 'limpieza_piercing' ||
          kind === 'cambio_piercing' ||
          (row.serviceType || '').toLowerCase().includes('pierc') ||
          (row.serviceType || '').toLowerCase() === 'cambio' ||
          (row.serviceType || '').toLowerCase() === 'limpieza';
        if (!piercingFamily) return false;
      } else if (row.serviceType !== service) {
        return false;
      }
    }
    if (status !== 'Todos' && row.statusLabel.toLowerCase() !== status.toLowerCase()) {
      return false;
    }
    if (piercingKind !== 'Todos') {
      if (!appointmentMatchesPiercingSubtype(row, piercingKind, piercingTypeLabels)) {
        return false;
      }
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

export function appointmentMatchesPiercingSubtype(
  row: Appointment,
  subtype: string,
  piercingTypeLabels: Readonly<Record<number, string>> = {},
): boolean {
  const kind = inferWorkKindFromAppointment(row);
  if (isPiercingWorkKindFilter(subtype)) {
    return kind === (subtype as BookingWorkKind);
  }
  if (!isPiercingAnatomyFilter(subtype)) return false;
  // Tipos anatómicos solo aplican a colocación de piercing.
  if (kind !== 'piercing') return false;
  const survey = piercingTypeLabels[row.id] ?? '';
  const fromSurvey = resolvePiercingTypeCanonical(survey);
  if (fromSurvey === subtype) return true;
  const fromDetail = resolvePiercingTypeCanonical(row.detail);
  return fromDetail === subtype;
}

/**
 * Agenda de tatuador/perforador: solo citas del día en curso o con estado reprogramada.
 */
export function filterTechnicianAgenda(items: Appointment[]): Appointment[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = now.getDate();
  return items.filter((row) => {
    if (row.status === 'cancelada' || row.status === 'finalizada') return false;
    if (row.status === 'reprogramada') return true;
    const d = row.appointmentDate;
    if (!d) return false;
    return d.getFullYear() === y && d.getMonth() === m && d.getDate() === day;
  });
}

export function uniqueServices(items: Appointment[]): string[] {
  const set = new Set<string>();
  for (const a of items) {
    if (a.serviceType && a.serviceType !== '—') set.add(a.serviceType);
  }
  return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))];
}
