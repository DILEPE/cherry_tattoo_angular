/** Paridad con `streamlit_app/citas_tab.py` y `panel_auth`. */

export function maySeeAllAppointments(role: string): boolean {
  return role === 'administrador' || role === 'vendedor';
}

export function isTechnicianRole(role: string): boolean {
  return role === 'tatuador' || role === 'perforador';
}

export const PANEL_ROLE_LABEL_ES: Record<string, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  tatuador: 'Tatuador',
  perforador: 'Perforador',
};
