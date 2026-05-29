import { Appointment } from './appointment.model';

/** Clave de día (año, mes 1-12, día). */
export type DayKey = string;

export type ClientPillKind = 'new' | 'returning' | 'priority' | 'reprogramada' | 'cancelada';

export type AppointmentsViewMode = 'calendar' | 'list';

/** Mes compacto, mes por equipo o rejilla semanal (Streamlit). */
export type CalendarPeriod = 'month' | 'team' | 'week';

/** Máximo de citas visibles en celda mensual compacta antes de «+N citas». */
export const CALENDAR_COMPACT_MAX_VISIBLE = 4;

export const WEEK_SCHEDULE_SLOT_PX = 72;

export interface WeekDayHeaderView {
  date: Date;
  weekdayLabel: string;
  dayNum: number;
  isToday: boolean;
  isPast: boolean;
}

export interface WeekAppointmentBlockView {
  appointmentId: number;
  topPx: number;
  heightPx: number;
  leftPct: number;
  widthPct: number;
  timeLabel: string;
  customerName: string;
  totalCompact: string;
  pillKind: ClientPillKind;
  muted: boolean;
  singleSlot: boolean;
  tooltip: string;
}

export interface WeekDayColumnView {
  date: Date;
  isToday: boolean;
  totalHeightPx: number;
  blocks: WeekAppointmentBlockView[];
}

export interface WeekScheduleView {
  monday: Date;
  spanLabel: string;
  slotList: string[];
  slotPx: number;
  dayHeaders: WeekDayHeaderView[];
  dayColumns: WeekDayColumnView[];
}

export interface CalendarMonthState {
  year: number;
  month: number;
}

export interface CalendarDayDescriptor {
  day: number;
  inMonth: boolean;
  date: Date | null;
}

export interface CalendarAppointmentSlotView {
  id: number;
  timeLabel: string;
  customerShort: string;
  customerFull: string;
  serviceType: string;
  serviceFlagClass: string;
  totalCompact: string;
  totalFmt: string;
  artistLabel: string;
  contractPending: boolean;
  pillKind: ClientPillKind;
  muted: boolean;
  tooltip: string;
  appointment: Appointment;
}

export interface CalendarDayTeamGroupView {
  staffLabel: string;
  slots: CalendarAppointmentSlotView[];
}

export interface CalendarDayCellView {
  day: number;
  inMonth: boolean;
  date: Date | null;
  isToday: boolean;
  isPast: boolean;
  slots: CalendarAppointmentSlotView[];
  /** Citas ocultas por overflow (solo vista compacta). */
  hiddenCount: number;
  allSlots: CalendarAppointmentSlotView[];
  teamGroups: CalendarDayTeamGroupView[];
}

export const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const WEEKDAY_HEADERS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
