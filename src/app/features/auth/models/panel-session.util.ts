import { PanelUserSession } from './panel-auth.model';

/** Debe coincidir con `PANEL_SESSION_LIFETIME_MINUTES` del backend (60 min). */
export const PANEL_SESSION_TTL_MS = 60 * 60 * 1000;

export function panelSessionExpiresAtMs(fromMs: number = Date.now()): number {
  return fromMs + PANEL_SESSION_TTL_MS;
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
