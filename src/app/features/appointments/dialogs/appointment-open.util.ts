import { AppointmentModalData } from '../models/appointment-modal.model';

interface AppointmentModalUi {
  closeModal(): void;
  openModal<T>(id: string, data: T): void;
}

interface AppointmentModalStore {
  viewMode(): string;
}

/** Abre la ficha o el detalle de cita según la vista actual (lista vs calendario). */
export function openAppointmentModal(
  ui: AppointmentModalUi,
  store: AppointmentModalStore,
  appointmentId: number,
  options?: { closeActiveModal?: boolean },
): void {
  if (appointmentId <= 0) return;
  const data: AppointmentModalData = { appointmentId };
  const modalId =
    store.viewMode() === 'calendar' ? 'appointment-focus' : 'appointment-detail';
  if (options?.closeActiveModal !== false) {
    ui.closeModal();
  }
  ui.openModal(modalId, data);
}
