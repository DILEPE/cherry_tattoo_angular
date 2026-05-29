import { AppointmentFilters } from '../../appointments/models/appointment.model';

export function buildSurveyStatsQueryParams(
  filters: Pick<AppointmentFilters, 'fromDate' | 'toDate'>,
): Record<string, string> | undefined {
  const params: Record<string, string> = {};
  const from = String(filters.fromDate ?? '').trim();
  const to = String(filters.toDate ?? '').trim();
  if (from) params['from_date'] = from;
  if (to) params['to_date'] = to;
  return Object.keys(params).length ? params : undefined;
}

export function surveyStatsDateFilterLabel(
  filters: Pick<AppointmentFilters, 'fromDate' | 'toDate'>,
): string {
  const from = String(filters.fromDate ?? '').trim();
  const to = String(filters.toDate ?? '').trim();
  if (from && to) return `Citas del ${from} al ${to}`;
  if (from) return `Citas desde ${from}`;
  if (to) return `Citas hasta ${to}`;
  return 'Todas las fechas';
}
