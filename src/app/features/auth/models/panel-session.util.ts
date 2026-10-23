import { PanelUserSession } from './panel-auth.model';

/**
 * Tiempo máximo de **inactividad** antes de cerrar sesión.
 * Debe coincidir con `PANEL_SESSION_LIFETIME_MINUTES` del backend (valor inicial al login).
 * La actividad del usuario renueva el plazo en el cliente.
 */
export const PANEL_SESSION_IDLE_TTL_MS = 60 * 60 * 1000;

/** @deprecated Usar `PANEL_SESSION_IDLE_TTL_MS`. */
export const PANEL_SESSION_TTL_MS = PANEL_SESSION_IDLE_TTL_MS;

export function panelSessionExpiresAtMs(fromMs: number = Date.now()): number {
  return fromMs + PANEL_SESSION_IDLE_TTL_MS;
}

export function isPanelSessionExpired(
  session: Pick<PanelUserSession, 'sessionExpiresAt'> | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!session?.sessionExpiresAt) return true;
  return nowMs >= session.sessionExpiresAt;
}

export function sessionFromApiUser(
  user: {
    id: number;
    username: string;
    role: string;
    store_id?: number | null;
    storeId?: number | null;
    store_name?: string | null;
    storeName?: string | null;
    session_expires_at?: number;
    appointment_id?: number | null;
    appointmentId?: number | null;
    customer_id?: number | null;
    customerId?: number | null;
  },
): PanelUserSession {
  const apiSec = user.session_expires_at;
  const sessionExpiresAt =
    typeof apiSec === 'number' && Number.isFinite(apiSec)
      ? Math.round(apiSec * 1000)
      : panelSessionExpiresAtMs();
  const storeIdRaw = Number(user.storeId ?? user.store_id ?? 0);
  const storeId = Number.isFinite(storeIdRaw) && storeIdRaw > 0 ? storeIdRaw : 0;
  const storeName = String(user.storeName ?? user.store_name ?? '').trim();
  const appointmentRaw = Number(user.appointmentId ?? user.appointment_id ?? 0);
  const appointmentId =
    Number.isFinite(appointmentRaw) && appointmentRaw > 0 ? appointmentRaw : undefined;
  const customerRaw = Number(user.customerId ?? user.customer_id ?? user.id ?? 0);
  const customerId =
    Number.isFinite(customerRaw) && customerRaw > 0 ? customerRaw : undefined;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    store_id: storeId || undefined,
    storeId: storeId || undefined,
    storeName: storeName || undefined,
    store_name: storeName || undefined,
    appointmentId,
    appointment_id: appointmentId,
    customerId,
    customer_id: customerId,
    sessionExpiresAt,
  };
}
