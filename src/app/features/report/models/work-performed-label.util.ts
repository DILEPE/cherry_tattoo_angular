import { Appointment } from '../../appointments/models/appointment.model';
import {
  BOOKING_WORK_KIND_META,
  BookingWorkKind,
} from '../../appointments/models/booking.model';
import { inferWorkKindFromAppointment } from '../../appointments/models/booking.mapper';

/** Mismo criterio que `appointment_to_contract_kind` en el backend. */
export function appointmentContractKind(appt: Appointment): 'tattoo' | 'piercing' {
  const svc = (appt.serviceType || '').toLowerCase();
  const det = (appt.detail || '').toLowerCase();
  if (svc.includes('tatu') || det.includes('tatu') || svc === 'tattoo') {
    return 'tattoo';
  }
  return 'piercing';
}

/** IDs de citas no tatuaje para consultar tipo de perforación en encuesta. */
export function piercingAppointmentIdsForSurvey(rows: Appointment[]): number[] {
  const ids = new Set<number>();
  for (const row of rows) {
    if (appointmentContractKind(row) === 'tattoo') continue;
    if (row.id > 0) ids.add(row.id);
  }
  return [...ids].sort((a, b) => a - b);
}

function bookingWorkKindLabel(kind: BookingWorkKind): string {
  return BOOKING_WORK_KIND_META[kind]?.label?.trim() || '—';
}

/**
 * Columna «Tipo trabajo / perforación» del informe financiero.
 * - Tatuaje → «Tatuaje»
 * - Limpieza / cambio piercing → etiquetas de agenda
 * - Colocación piercing → tipo de perforación (encuesta) o fallback
 */
export function reportWorkPerformedLabel(
  appt: Appointment,
  piercingSurveyByAppointment: Readonly<Record<number, string>> = {},
): string {
  const workKind = inferWorkKindFromAppointment(appt);

  if (workKind === 'tatuaje') {
    return 'Tatuaje';
  }
  if (workKind === 'limpieza_piercing' || workKind === 'cambio_piercing') {
    return bookingWorkKindLabel(workKind);
  }

  const fromSurvey = piercingSurveyByAppointment[appt.id];
  if (fromSurvey?.trim()) {
    return fromSurvey.trim();
  }

  return bookingWorkKindLabel('piercing');
}
