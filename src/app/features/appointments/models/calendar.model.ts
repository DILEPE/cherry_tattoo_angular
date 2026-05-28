import { Appointment } from './appointment.model';

/** Clave de día (año, mes 1-12, día). */
export type DayKey = string;

export type ClientPillKind = 'new' | 'returning' | 'priority' | 'reprogramada' | 'cancelada';

export type AppointmentsViewMode = 'calendar' | 'list';

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
  totalCompact: string;
  pillKind: ClientPillKind;
  muted: boolean;
  tooltip: string;
  appointment: Appointment;
}

export interface CalendarDayCellView {
  day: number;
  inMonth: boolean;
  date: Date | null;
  isToday: boolean;
  isPast: boolean;
  slots: CalendarAppointmentSlotView[];
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
