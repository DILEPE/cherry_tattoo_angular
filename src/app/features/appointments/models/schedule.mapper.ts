import { Appointment } from './appointment.model';
import { appointmentRowDate, appointmentTimeHm } from './calendar.mapper';
import { ScheduleKind } from './booking.model';
import { appointmentToScheduleKind } from './booking.mapper';
import { durationSlotsForRow } from './agenda-slots.mapper';

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
