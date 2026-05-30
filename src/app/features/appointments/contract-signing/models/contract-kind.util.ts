import { Appointment } from '../../models/appointment.model';

export type ContractKind = 'tattoo' | 'piercing';

export function appointmentToContractKind(appt: Appointment): ContractKind {
  const svc = (appt.serviceType || '').toLowerCase();
  const det = (appt.detail || '').toLowerCase();
  if (svc.includes('tatu') || det.includes('tatu')) return 'tattoo';
  return 'piercing';
}

export const CONTRACT_KIND_LABEL_ES: Record<ContractKind, string> = {
  tattoo: 'Tatuaje',
  piercing: 'Piercing',
};
