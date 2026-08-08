import { Appointment } from './appointment.model';
import {
  BOOKING_WORK_KIND_META,
  BOOKING_WORK_KIND_ORDER,
  BookingWorkKind,
} from './booking.model';
import { inferWorkKindFromAppointment } from './booking.mapper';
import {
  piercingTypeDisplayLabel,
  resolvePiercingTypeCanonical,
} from './piercing-type-catalog';

export interface DailyWorkCountRow {
  key: string;
  label: string;
  count: number;
}

export interface DailyWorkReport {
  dateIso: string;
  total: number;
  byWorkKind: DailyWorkCountRow[];
  byPiercingPlacement: DailyWorkCountRow[];
}

/** Fecha local `YYYY-MM-DD` (misma convención que filtros de citas). */
export function localDateIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function appointmentLocalDateIso(appt: Appointment): string | null {
  const d = appt.appointmentDate;
  if (!d) return null;
  return localDateIso(d);
}

function isFinalized(appt: Appointment): boolean {
  return (appt.statusLabel || '').trim().toLowerCase() === 'finalizada';
}

function placementLabel(
  appt: Appointment,
  piercingLabels: Readonly<Record<number, string>>,
): string {
  const fromSurvey = piercingLabels[appt.id]?.trim();
  const canonical =
    resolvePiercingTypeCanonical(fromSurvey) ||
    resolvePiercingTypeCanonical(appt.detail);
  if (canonical) return piercingTypeDisplayLabel(canonical);
  if (fromSurvey) return fromSurvey;
  return 'Sin tipo especificado';
}

function increment(
  map: Map<string, { label: string; count: number }>,
  key: string,
  label: string,
): void {
  const prev = map.get(key);
  if (prev) {
    prev.count += 1;
    return;
  }
  map.set(key, { label, count: 1 });
}

/**
 * Resume el trabajo finalizado de un día: conteo por tipo de agenda
 * y, para colocaciones, desglose por tipo de perforación (Helix, Lóbulo, …).
 */
export function buildDailyWorkReport(
  items: readonly Appointment[],
  piercingLabels: Readonly<Record<number, string>> = {},
  dateIso: string = localDateIso(),
): DailyWorkReport {
  const kindCounts = new Map<BookingWorkKind, number>();
  for (const kind of BOOKING_WORK_KIND_ORDER) {
    kindCounts.set(kind, 0);
  }

  const placementCounts = new Map<string, { label: string; count: number }>();
  let total = 0;

  for (const row of items) {
    if (!isFinalized(row)) continue;
    if (appointmentLocalDateIso(row) !== dateIso) continue;
    total += 1;

    const kind = inferWorkKindFromAppointment(row);
    kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);

    if (kind === 'piercing') {
      const label = placementLabel(row, piercingLabels);
      increment(placementCounts, label.toLowerCase(), label);
    }
  }

  const byWorkKind: DailyWorkCountRow[] = BOOKING_WORK_KIND_ORDER.map((kind) => ({
    key: kind,
    label: BOOKING_WORK_KIND_META[kind].label,
    count: kindCounts.get(kind) ?? 0,
  }));

  const byPiercingPlacement: DailyWorkCountRow[] = [...placementCounts.entries()]
    .map(([key, row]) => ({ key, label: row.label, count: row.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));

  return { dateIso, total, byWorkKind, byPiercingPlacement };
}
