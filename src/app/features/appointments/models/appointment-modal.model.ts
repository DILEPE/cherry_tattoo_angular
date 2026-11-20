/** Payload de modales de cita (UiStore.activeModal.data). */
export interface AppointmentModalData {
  appointmentId: number;
}

export interface BookAppointmentModalData {
  /** YYYY-MM-DD */
  pickedDate: string;
  /** Cita express: fecha editable (también pasada) y cualquier tipo de trabajo. */
  express?: boolean;
}

export interface CalendarDayOverflowModalData {
  /** YYYY-MM-DD */
  pickedDate: string;
}
