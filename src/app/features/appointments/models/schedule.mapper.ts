import { Appointment } from './appointment.model';
import { appointmentRowDate, appointmentTimeHm } from './calendar.mapper';
import { ScheduleKind } from './booking.model';
import { appointmentToScheduleKind, MAX_BOOKING_DURATION_SLOTS } from './booking.mapper';
import { durationSlotsForRow } from './agenda-slots.mapper';
import {
  appointmentBlockEndSlot,
  durationSlotsFromStartEnd,
  endBlockSlotOptions,
} from './appointment-slots';

export function appointmentsSameDay(
  items: Appointment[],
  day: Date,
): Appointment[] {
  return items.filter((row) => {
    const d = row.appointmentDate ? appointmentRowDate(row.appointmentDate) : null;
    return d && d.getTime() === stripTime(day).getTime();
  });
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Citas del mismo día que ocupan agenda del profesional (o sin asignar)
 * para el rol/horario: tatuaje vs piercing no se bloquean entre sí.
 */
export function appointmentsForArtistSchedule(
  items: Appointment[],
  day: Date,
  artistId: number | null,
  scheduleKind: ScheduleKind,
  excludeAppointmentId?: number,
): Appointment[] {
  return appointmentsSameDay(items, day).filter((row) => {
    if (excludeAppointmentId != null && row.id === excludeAppointmentId) return false;
    if (row.status === 'cancelada') return false;
    if (appointmentToScheduleKind(row) !== scheduleKind) return false;
    const ra = row.assignedPanelUserId;
    if (ra == null || ra <= 0) return true;
    if (artistId != null && ra === artistId) return true;
    return false;
  });
}

export function busySlotIndices(
  dayRows: Appointment[],
  slotList: string[],
): Set<number> {
  const busy = new Set<number>();
  const n = slotList.length;
  for (const row of dayRows) {
    if (row.status === 'cancelada') continue;
    const hm = appointmentTimeHm(row.appointmentDateRaw ?? row.appointmentDate);
    if (hm === '—') continue;
    const startIdx = slotList.indexOf(hm);
    if (startIdx < 0) continue;
    const dur = durationSlotsForRow(row);
    for (let j = startIdx; j < Math.min(startIdx + dur, n); j++) {
      busy.add(j);
    }
  }
  return busy;
}

export function availableStartSlots(
  slotList: string[],
  needSlots: number,
  busy: Set<number>,
): string[] {
  const n = slotList.length;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (i + needSlots > n) break;
    let blocked = false;
    for (let j = i; j < i + needSlots; j++) {
      if (busy.has(j)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) out.push(slotList[i]);
  }
  return out;
}

/** Inicios con al menos `minSlots` libres consecutivos (luego se elige la hora de fin). */
export function availableStartTimes(
  slotList: string[],
  busy: Set<number>,
  minSlots = 1,
): string[] {
  return availableStartSlots(slotList, Math.max(1, minSlots), busy);
}

/**
 * Horas de fin posibles desde `startHm` que no cruzan ocupación del artista.
 * La duración queda definida solo por inicio + fin.
 */
export function availableEndTimes(
  startHm: string,
  slotList: string[],
  busy: Set<number>,
  maxDur = MAX_BOOKING_DURATION_SLOTS,
): string[] {
  const si = slotList.indexOf(startHm);
  if (si < 0) return [];
  const candidates = endBlockSlotOptions(startHm, slotList, maxDur);
  return candidates.filter((endHm) => {
    const dur = durationSlotsFromStartEnd(startHm, endHm, slotList);
    for (let j = si; j < si + dur; j++) {
      if (j >= slotList.length || busy.has(j)) return false;
    }
    return true;
  });
}

/** Hora de fin por defecto (duración preferida) dentro de las libres. */
export function preferredEndTime(
  startHm: string,
  preferredSlots: number,
  endOptions: string[],
  slotList: string[],
): string {
  if (!endOptions.length) return appointmentBlockEndSlot(startHm, 1, slotList);
  const preferred = appointmentBlockEndSlot(startHm, preferredSlots, slotList);
  if (endOptions.includes(preferred)) return preferred;
  return endOptions[0];
}
