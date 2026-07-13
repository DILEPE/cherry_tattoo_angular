/** Paridad con `streamlit_app/citas_tab.py` y `panel_auth`. */

export function maySeeAllAppointments(role: string): boolean {
  return role === 'administrador' || role === 'vendedor';
}

export function isTechnicianRole(role: string): boolean {
  return role === 'tatuador' || role === 'perforador';
}

/** Admin/vendedor pueden ajustar montos y abonos; tatuador/perforador no. */
export function canManageAppointmentAmounts(role: string): boolean {
  return !isTechnicianRole(role);
}

export const PANEL_ROLE_LABEL_ES: Record<string, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  tatuador: 'Tatuador',
  perforador: 'Perforador',
};
