import { Appointment } from './appointment.model';
import { durationSlotsForRow } from './agenda-slots.mapper';
import { timeSlotOptions } from './appointment-slots';
import {
  appointmentTimeHm,
  dayKeyFromDate,
  toCalendarSlotView,
} from './calendar.mapper';
import {
  WEEK_SCHEDULE_SLOT_PX,
  WEEKDAY_HEADERS_ES,
  WeekAppointmentBlockView,
  WeekDayColumnView,
  WeekDayHeaderView,
  WeekScheduleView,
} from './calendar.model';

export function weekMonday(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

export function dateToIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToLocalDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  if (!m) return weekMonday(new Date());
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function currentWeekMondayIso(): string {
  return dateToIsoLocal(weekMonday(new Date()));
}

export function weekSpanLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const y = sunday.getFullYear();
  return `${fmt(monday)} – ${fmt(sunday)}/${y}`;
}

function parseSegments(
  dayRows: Appointment[],
  slotList: string[],
): { row: Appointment; startIdx: number; vis: number }[] {
  const n = slotList.length;
  const raw: { row: Appointment; startIdx: number; vis: number }[] = [];
  for (const row of dayRows) {
    const hm = appointmentTimeHm(row.appointmentDateRaw ?? row.appointmentDate);
    const startIdx = slotList.indexOf(hm);
    if (startIdx < 0) continue;
    const dur = durationSlotsForRow(row);
    const endIdx = Math.min(startIdx + dur, n);
    const vis = Math.max(0, endIdx - startIdx);
    if (vis <= 0) continue;
    raw.push({ row, startIdx, vis });
  }
  raw.sort((a, b) => a.startIdx - b.startIdx || b.vis - a.vis);
  return raw;
}

function assignLanes(
  raw: { row: Appointment; startIdx: number; vis: number }[],
): { row: Appointment; startIdx: number; vis: number; lane: number; nLanes: number }[] {
  const lanesEnd: number[] = [];
  const assignments: { row: Appointment; startIdx: number; vis: number; lane: number }[] = [];
  for (const { row, startIdx, vis } of raw) {
    const endIdx = startIdx + vis;
    let lane = -1;
    for (let li = 0; li < lanesEnd.length; li++) {
      if (startIdx >= lanesEnd[li]) {
        lane = li;
        lanesEnd[li] = endIdx;
        break;
      }
    }
    if (lane < 0) {
      lane = lanesEnd.length;
      lanesEnd.push(endIdx);
    }
    assignments.push({ row, startIdx, vis, lane });
  }
  const nLanes = Math.max(1, lanesEnd.length);
  return assignments.map((a) => ({ ...a, nLanes }));
}

function buildDayBlocks(
  dayRows: Appointment[],
  slotList: string[],
  slotPx: number,
  countsByClient: Map<string, number>,
): WeekAppointmentBlockView[] {
  const placed = assignLanes(parseSegments(dayRows, slotList));
  return placed.map(({ row, startIdx, vis, lane, nLanes }) => {
    const slotView = toCalendarSlotView(row, countsByClient);
    const topPx = startIdx * slotPx;
    const heightPx = Math.max(vis * slotPx - 3, slotPx - 4);
    const widthPct = 100 / nLanes;
    const leftPct = lane * widthPct;
    return {
      appointmentId: row.id,
      topPx,
      heightPx,
      leftPct,
      widthPct,
      timeLabel: slotView.timeLabel,
      customerName: slotView.customerFull,
      totalCompact: slotView.totalCompact,
      pillKind: slotView.pillKind,
      muted: slotView.muted,
      singleSlot: vis <= 1,
      tooltip: slotView.tooltip,
    };
  });
}

export function buildWeekScheduleView(
  mondayIso: string,
  byDay: Map<string, Appointment[]>,
  countsByClient: Map<string, number>,
  slotPx: number = WEEK_SCHEDULE_SLOT_PX,
): WeekScheduleView {
  const monday = isoToLocalDate(mondayIso);
  const slotList = timeSlotOptions();
  const nSlots = slotList.length;
  const totalHeightPx = nSlots * slotPx;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const dayHeaders: WeekDayHeaderView[] = [];
  const dayColumns: WeekDayColumnView[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = dayKeyFromDate(d);
    const dayRows = byDay.get(key) ?? [];
    const isToday = d.getTime() === todayStart.getTime();
    const isPast = d < todayStart;
    dayHeaders.push({
      date: d,
      weekdayLabel: WEEKDAY_HEADERS_ES[i],
      dayNum: d.getDate(),
      isToday,
      isPast,
    });
    dayColumns.push({
      date: d,
      isToday,
      totalHeightPx,
      blocks: buildDayBlocks(dayRows, slotList, slotPx, countsByClient),
    });
  }

  return {
    monday,
    spanLabel: weekSpanLabel(monday),
    slotList,
    slotPx,
    dayHeaders,
    dayColumns,
  };
}
