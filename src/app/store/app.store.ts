import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { PanelAuthApiService } from '../features/auth/services/panel-auth-api.service';
import { ToastService } from '../shared/ui/toast/toast.service';
import { apiErrorMessage } from '../core/services/api.service';
import { PanelModuleKey, PanelUserSession } from '../features/auth/models/panel-auth.model';
import {
  isPanelSessionExpired,
  panelSessionExpiresAtMs,
  sessionFromApiUser,
} from '../features/auth/models/panel-session.util';

const SESSION_KEY = 'cherry_panel_session';

interface AppState {
  user: PanelUserSession | null;
  allowedModules: PanelModuleKey[];
  authLoading: boolean;
  authError: string | null;
}

const initialState: AppState = {
  user: null,
  allowedModules: [],
  authLoading: false,
  authError: null,
};

function loadPersistedSession(): PanelUserSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PanelUserSession;
    if (!parsed?.id || isPanelSessionExpired(parsed)) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(() => ({
    ...initialState,
    user: loadPersistedSession(),
  })),
  withComputed(({ user, allowedModules }) => ({
    isAuthenticated: computed(() => {
      const u = user();
      return !!u?.id && !isPanelSessionExpired(u);
    }),
    isAdmin: computed(() => user()?.role === 'administrador'),
    allowedModuleKeys: computed(() => {
      const mods = allowedModules();
      if (mods.length) return mods;
      const u = user();
      if (!u) return [] as PanelModuleKey[];
      return u.effectiveModules ?? [];
    }),
  })),
  withMethods((store, authApi = inject(PanelAuthApiService), toast = inject(ToastService)) => {
    const persist = (user: PanelUserSession | null) => {
      if (user && !isPanelSessionExpired(user)) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    };

    const clearSession = () => {
      patchState(store, { ...initialState });
      persist(null);
    };

    const loadModules = rxMethod<number>(
      pipe(
        switchMap((userId) =>
          authApi.getEffectiveModules(userId).pipe(
            tapResponse({
              next: (modules) => patchState(store, { allowedModules: modules }),
              error: () => patchState(store, { allowedModules: [] }),
            }),
          ),
        ),
      ),
    );

    return {
      canAccessModule(key: string): boolean {
        if (!store.isAuthenticated()) return false;
        const u = store.user();
        if (!u) return false;
        if (key === 'usuarios_panel') {
          return u.role === 'administrador';
        }
        if (u.role === 'administrador') {
          return [
            'citas',
            'clientes',
            'contratos',
            'encuestas',
            'reporte',
            'tiendas',
          ].includes(key);
        }
        return store.allowedModuleKeys().includes(key as PanelModuleKey);
      },
      initFromSession(): void {
        const u = store.user();
        if (!u) return;
        if (isPanelSessionExpired(u)) {
          clearSession();
          return;
        }
        loadModules(u.id);
      },
      ensureSessionValid(): boolean {
        const u = store.user();
        if (!u) return false;
        if (isPanelSessionExpired(u)) {
          clearSession();
          return false;
        }
        return true;
      },
      /** Renueva el plazo de sesión ante actividad del usuario (no cuenta como inactividad). */
      touchSessionActivity(): void {
        const u = store.user();
        if (!u) return;
        if (isPanelSessionExpired(u)) {
          clearSession();
          return;
        }
        const next: PanelUserSession = {
          ...u,
          sessionExpiresAt: panelSessionExpiresAtMs(),
        };
        patchState(store, { user: next });
        persist(next);
      },
      login: rxMethod<{ username: string; password: string }>(
        pipe(
          tap(() => patchState(store, { authLoading: true, authError: null })),
          switchMap(({ username, password }) =>
            authApi.login(username, password).pipe(
              tapResponse({
                next: (resp) => {
                  const session: PanelUserSession = {
                    ...sessionFromApiUser(resp.user),
                    effectiveModules: [],
                  };
                  patchState(store, {
                    user: session,
                    authLoading: false,
                    authError: null,
                  });
                  persist(session);
                  loadModules(session.id);
                },
                error: (err: unknown) => {
                  const status =
                    err && typeof err === 'object' && 'status' in err
                      ? Number((err as { status: number }).status)
                      : 0;
                  const message = apiErrorMessage(err) || 'No se pudo iniciar sesión';
                  patchState(store, {
                    authLoading: false,
                    authError: message,
                  });
                  if (status === 0) {
                    toast.error(message);
                  } else if (status === 401) {
                    toast.error('Usuario o contraseña incorrectos.');
                  } else {
                    toast.error(message);
                  }
                },
              }),
            ),
          ),
        ),
      ),
      logout(): void {
        clearSession();
      },
      setAllowedModules(modules: PanelModuleKey[]): void {
        patchState(store, { allowedModules: modules });
        const u = store.user();
        if (u && !isPanelSessionExpired(u)) {
          persist({ ...u, effectiveModules: modules });
        }
      },
    };
  }),
);
