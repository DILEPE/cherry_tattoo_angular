import { Appointment } from './appointment.model';
import {
  CalendarAppointmentSlotView,
  CalendarDayCellView,
  CalendarDayDescriptor,
  CalendarDayTeamGroupView,
  CalendarMonthState,
  CALENDAR_COMPACT_MAX_VISIBLE,
  ClientPillKind,
  DayKey,
} from './calendar.model';
import { serviceToBadgeVariant } from './appointment.mapper';

export function dayKeyFromDate(d: Date): DayKey {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function appointmentRowDate(val: string | Date | null | undefined): Date {
  if (!val) return new Date(1990, 0, 1);
  if (val instanceof Date) {
    return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }
  const s = String(val).trim().replace('T', ' ');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(1990, 0, 1);
}

export function appointmentTimeHm(val: string | Date | null | undefined): string {
  if (!val) return '—';
  if (val instanceof Date) {
    if (val.getHours() === 0 && val.getMinutes() === 0 && !String(val).includes('T')) {
      return '—';
    }
    return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
  }
  const s = String(val).trim().replace('T', ' ');
  const hm = s.match(/(\d{2}):(\d{2})/);
  if (hm) return `${hm[1]}:${hm[2]}`;
  return '—';
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function clientHistoryKey(appt: Appointment): string {
  if (appt.customerId != null && appt.customerId > 0) {
    return `id:${appt.customerId}`;
  }
  const ph = normalizePhoneDigits(appt.phone);
  if (ph) return `ph:${ph}`;
  const nm = appt.customerName.trim().toLowerCase();
  if (nm && nm !== '—') return `nm:${nm}`;
  return `row:${appt.id}`;
}

export function buildClientHistoryCounts(items: Appointment[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of items) {
    const key = clientHistoryKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function clientPillKind(
  appt: Appointment,
  countsByClient: Map<string, number>,
): ClientPillKind {
  const st = appt.status;
  if (st === 'cancelada') return 'cancelada';
  if (st === 'reprogramada') return 'reprogramada';
  if (appt.isPriority) return 'priority';
  const key = clientHistoryKey(appt);
  if ((countsByClient.get(key) ?? 0) > 1) return 'returning';
  return 'new';
}

export function serviceFlagCssClass(service: string): string {
  const v = serviceToBadgeVariant(service);
  return v === 'other' ? 'svc-flag-other' : `svc-flag-${v}`;
}

export function calendarMonthCompactLabel(total: number): string {
  const v = Math.round(Math.max(total, 0));
  if (v <= 0) return '—';
  if (v < 1000) return String(v);
  const n = Math.trunc(v / 1000);
  if (n < 1000) return String(n);
  return n.toLocaleString('es-CO').replace(/,/g, '.');
}

export function calendarCellCustomerLabel(fullName: string, longFromLen = 22): string {
  const nm = (fullName || '').trim() || '—';
  if (nm === '—' || nm.length <= longFromLen) return nm;
  const parts = nm.split(/\s+/);
  if (!parts.length) return `${nm.slice(0, longFromLen - 1)}…`;
  const first = parts[0];
  if (first.length > longFromLen) return `${first.slice(0, longFromLen - 1)}…`;
  return first;
}

function sortTimeKey(appt: Appointment): string {
  return appointmentTimeHm(appt.appointmentDateRaw ?? appt.appointmentDate);
}

export function groupAppointmentsByDay(items: Appointment[]): Map<DayKey, Appointment[]> {
  const buckets = new Map<DayKey, Appointment[]>();
  for (const row of items) {
    const d = row.appointmentDate ? appointmentRowDate(row.appointmentDate) : null;
    if (!d || d.getFullYear() === 1990) continue;
    const key = dayKeyFromDate(d);
    const list = buckets.get(key) ?? [];
    list.push(row);
    buckets.set(key, list);
  }
  for (const [key, list] of buckets) {
    list.sort((a, b) => sortTimeKey(a).localeCompare(sortTimeKey(b)));
    buckets.set(key, list);
  }
  return buckets;
}

export function toCalendarSlotView(
  appt: Appointment,
  countsByClient: Map<string, number>,
): CalendarAppointmentSlotView {
  const hm = appointmentTimeHm(appt.appointmentDateRaw ?? appt.appointmentDate);
  const customerFull = appt.customerName;
  const customerShort = calendarCellCustomerLabel(customerFull, 22);
  const artist =
    appt.assignedLabel !== '—' ? appt.assignedLabel.split(' (@')[0] : 'Sin asignar';
  const staffPart = artist !== 'Sin asignar' ? ` · ${appt.assignedLabel}` : '';
  const fin = appt.financials;
  return {
    id: appt.id,
    timeLabel: hm,
    customerShort,
    customerFull,
    serviceType: appt.serviceType,
    serviceFlagClass: serviceFlagCssClass(appt.serviceType),
    totalCompact: calendarMonthCompactLabel(fin.total),
    totalFmt: fin.totalFmt,
    artistLabel: artist,
    contractPending: appt.contractPendingArtistSignature,
    pillKind: clientPillKind(appt, countsByClient),
    muted: appt.status === 'cancelada',
    tooltip: `${hm} · ${customerFull}${staffPart} · Total: ${fin.totalFmt}`,
    appointment: appt,
  };
}

/** Semanas Lun–Dom con días 0 = fuera de mes. */
export function buildMonthWeeks(year: number, month: number): CalendarDayDescriptor[][] {
  const weeks: CalendarDayDescriptor[][] = [];
  const first = new Date(year, month - 1, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  let day = 1;
  let cell = 0;
  let week: CalendarDayDescriptor[] = [];

  for (let i = 0; i < pad; i++) {
    week.push({ day: 0, inMonth: false, date: null });
    cell++;
  }

  while (day <= daysInMonth) {
    if (cell === 7) {
      weeks.push(week);
      week = [];
      cell = 0;
    }
    week.push({
      day,
      inMonth: true,
      date: new Date(year, month - 1, day),
    });
    day++;
    cell++;
  }

  while (cell > 0 && cell < 7) {
    week.push({ day: 0, inMonth: false, date: null });
    cell++;
  }
  if (week.length) weeks.push(week);

  return weeks;
}

function emptyCell(): CalendarDayCellView {
  return {
    day: 0,
    inMonth: false,
    date: null,
    isToday: false,
    isPast: false,
    slots: [],
    hiddenCount: 0,
    allSlots: [],
    teamGroups: [],
  };
}

function buildCellSlots(
  rows: Appointment[],
  countsByClient: Map<string, number>,
  options: { teamLayout: boolean; maxVisible: number | null },
): Pick<CalendarDayCellView, 'slots' | 'hiddenCount' | 'allSlots' | 'teamGroups'> {
  const { teamLayout, maxVisible } = options;
  const allSlots = rows.map((r) => toCalendarSlotView(r, countsByClient));

  if (teamLayout) {
    const orderKeys: (number | string)[] = [];
    const buckets = new Map<number | string, Appointment[]>();
    const labels = new Map<number | string, string>();
    for (const row of rows) {
      const raw = row.assignedPanelUserId;
      const key = raw != null && raw > 0 ? raw : '__unassigned__';
      const lab = key === '__unassigned__' ? 'Sin asignar' : row.assignedLabel || '—';
      if (!buckets.has(key)) {
        buckets.set(key, []);
        orderKeys.push(key);
        labels.set(key, lab);
      }
      buckets.get(key)!.push(row);
    }
    const teamGroups: CalendarDayTeamGroupView[] = orderKeys.map((key) => ({
      staffLabel: labels.get(key) ?? '—',
      slots: (buckets.get(key) ?? []).map((r) => toCalendarSlotView(r, countsByClient)),
    }));
    return { slots: allSlots, hiddenCount: 0, allSlots, teamGroups };
  }

  const limit = maxVisible ?? allSlots.length;
  const visible = allSlots.slice(0, limit);
  const hiddenCount = Math.max(0, allSlots.length - visible.length);
  return { slots: visible, hiddenCount, allSlots, teamGroups: [] };
}
export function buildDayCellViews(
  weeks: CalendarDayDescriptor[][],
  byDay: Map<DayKey, Appointment[]>,
  countsByClient: Map<string, number>,
  today: Date,
  teamLayout = false,
  maxVisible: number | null = CALENDAR_COMPACT_MAX_VISIBLE,
): CalendarDayCellView[][] {
  const todayKey = dayKeyFromDate(today);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return weeks.map((week) =>
    week.map((desc) => {
      if (!desc.inMonth || !desc.date) {
        return emptyCell();
      }
      const key = dayKeyFromDate(desc.date);
      const rows = byDay.get(key) ?? [];
      const slotData = buildCellSlots(rows, countsByClient, {
        teamLayout,
        maxVisible: teamLayout ? null : maxVisible,
      });
      return {
        day: desc.day,
        inMonth: true,
        date: desc.date,
        isToday: key === todayKey,
        isPast: desc.date < todayStart,
        ...slotData,
      };
    }),
  );
}

export function shiftCalendarMonth(
  state: CalendarMonthState,
  delta: number,
): CalendarMonthState {
  let { year, month } = state;
  month += delta;
  while (month < 1) {
    month += 12;
    year--;
  }
  while (month > 12) {
    month -= 12;
    year++;
  }
  return { year, month };
}

export function currentCalendarMonth(): CalendarMonthState {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
