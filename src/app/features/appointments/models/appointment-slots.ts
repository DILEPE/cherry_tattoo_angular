import { appointmentRowDate, appointmentTimeHm } from './calendar.mapper';
import {
  MAX_BOOKING_DURATION_SLOTS,
  MIN_BOOKING_DURATION_SLOTS,
} from './booking.mapper';

/** Franjas cada 30 min (08:00–20:00), igual que Streamlit. */
export function timeSlotOptions(): string[] {
  const slots: string[] = [];
  for (let minutes = 8 * 60; minutes <= 20 * 60; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

export function parseExistingAppointmentSlot(
  raw: string | Date | null | undefined,
): { date: Date; slot: string } {
  const d = appointmentRowDate(raw ?? null);
  const hm = appointmentTimeHm(raw ?? null);
  const slotOpts = timeSlotOptions();
  const slot = hm !== '—' && slotOpts.includes(hm) ? hm : '09:00';
  return { date: d, slot };
}

export function combineAppointmentDatetime(date: Date, slotHm: string): string {
  const parts = (slotHm || '09:00').trim().split(':');
  const h = Number(parts[0]) || 9;
  const m = Number(parts[1]) || 0;
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Inicio de la última franja ocupada (uso interno / API). */
export function appointmentLastStartSlot(
  startHm: string,
  durSlots: number,
  slotOpts: string[],
): string {
  const si = slotOpts.indexOf(startHm);
  if (si < 0) return startHm;
  const lastI = Math.min(si + Math.max(durSlots, 1) - 1, slotOpts.length - 1);
  return slotOpts[lastI];
}

/** Hora de fin del bloque (p. ej. inicio 09:00 + 1 franja → 09:30). */
export function appointmentBlockEndSlot(
  startHm: string,
  durSlots: number,
  slotOpts: string[],
): string {
  const si = slotOpts.indexOf(startHm);
  if (si < 0) return startHm;
  const endIdx = si + Math.max(durSlots, 1);
  if (endIdx < slotOpts.length) return slotOpts[endIdx];
  return addMinutesToHm(slotOpts[slotOpts.length - 1], 30);
}

/** Duración en franjas cuando «Hasta» es la hora de fin del bloque. */
export function durationSlotsFromStartEnd(
  startHm: string,
  endHm: string,
  slotOpts: string[],
): number {
  const si = slotOpts.indexOf(startHm);
  if (si < 0) return MIN_BOOKING_DURATION_SLOTS;
  let ei = slotOpts.indexOf(endHm);
  if (ei < 0) {
    const lastStart = appointmentLastStartSlot(startHm, MAX_BOOKING_DURATION_SLOTS, slotOpts);
    const lastEnd = appointmentBlockEndSlot(lastStart, 1, slotOpts);
    if (endHm === lastEnd) {
      ei = slotOpts.length;
    } else {
      return MIN_BOOKING_DURATION_SLOTS;
    }
  }
  if (ei <= si) return MIN_BOOKING_DURATION_SLOTS;
  return Math.max(
    MIN_BOOKING_DURATION_SLOTS,
    Math.min(MAX_BOOKING_DURATION_SLOTS, ei - si),
  );
}

/** Opciones válidas para «Hasta» (hora de fin de bloque) dado un inicio. */
export function endBlockSlotOptions(
  startHm: string,
  slotOpts: string[],
  maxDur = MAX_BOOKING_DURATION_SLOTS,
): string[] {
  const si = slotOpts.indexOf(startHm);
  if (si < 0) return [];
  const out: string[] = [];
  for (let d = 1; d <= maxDur; d++) {
    const endIdx = si + d;
    if (endIdx < slotOpts.length) {
      out.push(slotOpts[endIdx]);
    } else if (d === 1 || out.length === 0) {
      out.push(addMinutesToHm(slotOpts[slotOpts.length - 1], 30));
      break;
    }
  }
  return out;
}

function addMinutesToHm(hm: string, minutes: number): string {
  const parts = hm.split(':').map((x) => parseInt(x, 10));
  const total = (parts[0] || 0) * 60 + (parts[1] || 0) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDatetimeCompactEs(iso: string): string {
  const s = iso.replace('T', ' ').trim();
  if (s.length >= 16) return s.slice(0, 16);
  return s;
}
