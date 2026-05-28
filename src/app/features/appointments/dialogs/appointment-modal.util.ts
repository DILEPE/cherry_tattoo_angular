import { ModalState } from '../../../store/ui.store';
import { AppointmentModalData } from '../models/appointment-modal.model';

export function resolveAppointmentModalId(ui: {
  activeModal: () => ModalState | null;
}): number {
  const data = ui.activeModal()?.data;
  if (typeof data === 'number') return data;
  if (data && typeof data === 'object' && 'appointmentId' in data) {
    return Number((data as AppointmentModalData).appointmentId);
  }
  return 0;
}
