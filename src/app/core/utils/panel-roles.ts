/** Paridad con `streamlit_app/citas_tab.py` y `panel_auth`. */

export function isAdminRole(role: string): boolean {
  return role === 'administrador';
}

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

/** Tienda del usuario del panel (0 si no hay). */
export function panelUserStoreId(
  user: { storeId?: number | null; store_id?: number | null } | null | undefined,
): number {
  const raw = user?.storeId ?? user?.store_id ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** El vendedor solo ve citas cuyo profesional asignado pertenece a su tienda. */
export function mustScopeAppointmentsToOwnStore(role: string): boolean {
  return isSellerRole(role);
}

export function staffInUserStore<T extends { storeId?: number | null }>(
  staff: readonly T[],
  storeId: number,
): T[] {
  if (storeId <= 0) return [...staff];
  return staff.filter((s) => Number(s.storeId ?? 0) === storeId);
}

/** Admin/vendedor pueden ajustar montos y registrar abonos; tatuador/perforador no. */
export function canManageAppointmentAmounts(role: string): boolean {
  return !isTechnicianRole(role);
}

/** Solo administrador puede editar un abono ya registrado (y nunca si está verificado). */
export function canEditAppointmentPayments(role: string): boolean {
  return role === 'administrador';
}

/**
 * Correo y celular del cliente: el vendedor no los ve.
 * Admin y técnicos sí (operación); vendedor no (seguridad).
 */
export function maySeeCustomerContact(role: string): boolean {
  return !isSellerRole(role);
}

/**
 * En visualización de contrato firmado: ficha completa solo admin.
 * Empleados ven nombre, apellidos y fecha de nacimiento (sin documento/contacto).
 */
export function maySeeFullCustomerOnContract(role: string): boolean {
  return isAdminRole(role);
}

export const PANEL_ROLE_LABEL_ES: Record<string, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  tatuador: 'Tatuador',
  perforador: 'Perforador',
};
