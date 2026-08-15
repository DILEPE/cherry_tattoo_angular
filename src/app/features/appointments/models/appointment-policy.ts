import { Appointment, AppointmentPayment } from './appointment.model';
import { canManageAppointmentAmounts } from '../../../core/utils/panel-roles';
import { appointmentRequiresContract } from './booking.mapper';

export function reprogramDisabledForRow(appt: Appointment): boolean {
  if (appt.id <= 0 || appt.status === 'cancelada') return true;
  if (appt.status !== 'agendada' && appt.status !== 'reprogramada') return true;
  if (appt.hasSignedContract) return true;
  return false;
}

export function canEditFinancials(appt: Appointment, role?: string): boolean {
  if (role != null && !canManageAppointmentAmounts(role)) return false;
  return appt.status === 'agendada' || appt.status === 'reprogramada';
}

export function canCancelAppointment(appt: Appointment): boolean {
  return appt.status !== 'cancelada' && appt.status !== 'finalizada';
}

export function contractBlockedByBalance(appt: Appointment): boolean {
  return appt.financials.total > 0 && appt.financials.pending > 0.009;
}

/** Verificación admin de abonos (tarea posterior; no se usa para bloquear la firma). */
export function contractBlockedByUnverifiedPayments(
  appt: Appointment,
  payments: AppointmentPayment[],
): boolean {
  if (appt.financials.total <= 0.009) return false;
  if (contractBlockedByBalance(appt)) return false;
  if (!payments.length) return true;
  return payments.some((p) => !p.isVerified);
}

export function firmarContratoDisabled(
  appt: Appointment,
  _payments: AppointmentPayment[] = [],
): boolean {
  if (!appointmentRequiresContract(appt)) return true;
  if (appt.id <= 0 || appt.customerId == null || appt.customerId <= 0) return true;
  if (appt.status === 'cancelada' || appt.status === 'finalizada') return true;
  if (contractBlockedByBalance(appt)) return true;
  // Verificación de abonos: tarea posterior; no bloquea firmar ni «Pendiente firma profesional».
  if (appt.hasSignedContract && !appt.contractPendingArtistSignature) return true;
  return false;
}

export function firmarContratoLabel(appt: Appointment): string {
  if (!appt.hasSignedContract) return 'Firmar contrato';
  if (appt.contractPendingArtistSignature) return 'Pendiente firma profesional';
  return 'Contrato firmado';
}

/** Limpieza / cambio: encuesta sin firma; al enviarla la cita queda finalizada. */
export function canManageSurveyWithoutContract(appt: Appointment): boolean {
  if (appointmentRequiresContract(appt)) return false;
  if (appt.id <= 0 || appt.customerId == null || appt.customerId <= 0) return false;
  return appt.status === 'agendada' || appt.status === 'reprogramada';
}

export function montosLockedForAppointment(appt: Appointment, role?: string): boolean {
  return !canEditFinancials(appt, role);
}
