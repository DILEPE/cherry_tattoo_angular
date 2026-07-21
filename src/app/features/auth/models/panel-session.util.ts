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
  user: { id: number; username: string; role: string; session_expires_at?: number },
): PanelUserSession {
  const apiSec = user.session_expires_at;
  const sessionExpiresAt =
    typeof apiSec === 'number' && Number.isFinite(apiSec)
      ? Math.round(apiSec * 1000)
      : panelSessionExpiresAtMs();
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    sessionExpiresAt,
  };
}
