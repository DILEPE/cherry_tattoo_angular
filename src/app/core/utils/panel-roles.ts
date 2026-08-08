/** Paridad con `streamlit_app/citas_tab.py` y `panel_auth`. */

export function maySeeAllAppointments(role: string): boolean {
  return role === 'administrador' || role === 'vendedor';
}

export function isTechnicianRole(role: string): boolean {
  return role === 'tatuador' || role === 'perforador';
}

/** Vendedor: agenda y búsqueda solo hoy + fechas futuras (sin historial pasado). */
export function isSellerRole(role: string): boolean {
  return role === 'vendedor';
}

/** Admin/vendedor pueden ajustar montos y registrar abonos; tatuador/perforador no. */
export function canManageAppointmentAmounts(role: string): boolean {
  return !isTechnicianRole(role);
}

/** Solo administrador puede editar un abono ya registrado (y nunca si está verificado). */
export function canEditAppointmentPayments(role: string): boolean {
  return role === 'administrador';
}

export const PANEL_ROLE_LABEL_ES: Record<string, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  tatuador: 'Tatuador',
  perforador: 'Perforador',
};
