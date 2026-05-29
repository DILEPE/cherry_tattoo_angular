import { Appointment } from './appointment.model';
import {
  BOOKING_WORK_KIND_META,
  BookingWorkKind,
  ScheduleKind,
} from './booking.model';

export function workKindToAssigneeRole(workKind: BookingWorkKind): string {
  return workKind === 'tatuaje' ? 'tatuador' : 'perforador';
}

export function workKindToScheduleKind(workKind: BookingWorkKind): ScheduleKind {
  return workKind === 'tatuaje' ? 'tattoo' : 'piercing';
}

export function serviceAndDetailForWorkKind(
  kind: BookingWorkKind,
  userDetail: string,
): { service: string; detail: string | null } {
  const meta = BOOKING_WORK_KIND_META[kind] ?? BOOKING_WORK_KIND_META.piercing;
  const svc = meta.serviceToken === 'tattoo' ? 'Tatuaje' : 'Perforación';
  const tag = meta.detailTag;
  const extra = (userDetail || '').trim();
  if (extra) return { service: svc, detail: `${tag} ${extra}`.trim() };
  return { service: svc, detail: tag };
}

export function appointmentToScheduleKind(appt: Appointment): ScheduleKind {
  const svc = (appt.serviceType || '').toLowerCase();
  const det = (appt.detail || '').toLowerCase();
  if (svc.includes('tatu') || det.includes('tatu')) return 'tattoo';
  return 'piercing';
}

export function inferWorkKindFromAppointment(appt: Appointment): BookingWorkKind {
  const det = (appt.detail || '').toLowerCase();
  const svc = (appt.serviceType || '').toLowerCase();
  if (det.includes('limpieza')) return 'limpieza_piercing';
  if (det.includes('cambio') && (det.includes('pierc') || svc.includes('pierc'))) {
    return 'cambio_piercing';
  }
  if (svc.includes('tatu') || det.includes('tatu')) return 'tatuaje';
  return 'piercing';
}

export const MIN_BOOKING_DURATION_SLOTS = 1;
export const MAX_BOOKING_DURATION_SLOTS = 16;

export function appendAgendaSlotsMarker(detail: string | null, slots: number): string {
  const n = Math.max(
    MIN_BOOKING_DURATION_SLOTS,
    Math.min(MAX_BOOKING_DURATION_SLOTS, Math.round(slots)),
  );
  const base = (detail || '').trim();
  return base ? `${base} [agenda_slots:${n}]` : `[agenda_slots:${n}]`;
}
