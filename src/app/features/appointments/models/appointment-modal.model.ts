/** Payload de modales de cita (UiStore.activeModal.data). */
export interface AppointmentModalData {
  appointmentId: number;
}

export interface BookAppointmentModalData {
  /** YYYY-MM-DD */
  pickedDate: string;
  /** Cita express: solo piercing / limpieza / cambio (sin tatuaje). */
  express?: boolean;
}

export interface CalendarDayOverflowModalData {
  /** YYYY-MM-DD */
  pickedDate: string;
}
