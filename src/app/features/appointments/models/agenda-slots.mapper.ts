import { Appointment } from './appointment.model';
import {
  MAX_BOOKING_DURATION_SLOTS,
  MIN_BOOKING_DURATION_SLOTS,
} from './booking.mapper';

const AGENDA_SLOTS_PATTERN = /\s*\[agenda_slots:(\d+)\]\s*$/i;

export function durationSlotsForRow(row: Appointment): number {
  const det = row.detail || '';
  const m = AGENDA_SLOTS_PATTERN.exec(det);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n)) {
      return Math.max(MIN_BOOKING_DURATION_SLOTS, Math.min(MAX_BOOKING_DURATION_SLOTS, n));
    }
  }
  const svc = (row.serviceType || '').toLowerCase();
  const detL = det.toLowerCase();
  const combined = `${svc} ${detL}`;
  if (detL.includes('limpieza')) return 1;
  if (detL.includes('cambio') && combined.includes('pierc')) return 1;
  if (combined.includes('tatu') || svc.includes('tatu')) return 4;
  if (combined.includes('pierc')) return 2;
  return 2;
}
