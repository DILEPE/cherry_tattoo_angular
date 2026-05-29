import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { PanelAuthApiService } from '../features/auth/services/panel-auth-api.service';
import { PanelModuleKey, PanelUserSession } from '../features/auth/models/panel-auth.model';

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
    return parsed?.id ? parsed : null;
  } catch {
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
    isAuthenticated: computed(() => user() !== null),
    isAdmin: computed(() => user()?.role === 'administrador'),
    allowedModuleKeys: computed(() => {
      const mods = allowedModules();
      if (mods.length) return mods;
      const u = user();
      if (!u) return [] as PanelModuleKey[];
      return u.effectiveModules ?? [];
    }),
  })),
  withMethods((store, authApi = inject(PanelAuthApiService)) => {
    const persist = (user: PanelUserSession | null) => {
      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
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
        if (u?.id) {
          loadModules(u.id);
        }
      },
      login: rxMethod<{ username: string; password: string }>(
        pipe(
          tap(() => patchState(store, { authLoading: true, authError: null })),
          switchMap(({ username, password }) =>
            authApi.login(username, password).pipe(
              tapResponse({
                next: (resp) => {
                  const session: PanelUserSession = {
                    ...resp.user,
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
                error: (err: { message?: string }) => {
                  patchState(store, {
                    authLoading: false,
                    authError: err?.message ?? 'Credenciales inválidas',
                  });
                },
              }),
            ),
          ),
        ),
      ),
      logout(): void {
        patchState(store, { ...initialState });
        persist(null);
      },
      setAllowedModules(modules: PanelModuleKey[]): void {
        patchState(store, { allowedModules: modules });
        const u = store.user();
        if (u) {
          persist({ ...u, effectiveModules: modules });
        }
      },
    };
  }),
);
