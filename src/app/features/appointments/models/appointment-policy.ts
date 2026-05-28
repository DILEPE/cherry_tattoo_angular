import { Appointment } from './appointment.model';

export function reprogramDisabledForRow(appt: Appointment): boolean {
  if (appt.id <= 0 || appt.status === 'cancelada') return true;
  if (appt.status !== 'agendada' && appt.status !== 'reprogramada') return true;
  if (appt.hasSignedContract) return true;
  return false;
}

export function canEditFinancials(appt: Appointment): boolean {
  return appt.status === 'agendada' || appt.status === 'reprogramada';
}

export function canCancelAppointment(appt: Appointment): boolean {
  return appt.status !== 'cancelada' && appt.status !== 'finalizada';
}
