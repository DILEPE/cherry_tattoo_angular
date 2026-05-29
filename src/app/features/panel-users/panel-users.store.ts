import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { PanelUsersApiService } from './services/panel-users-api.service';
import { StoresApiService } from './services/stores-api.service';
import { PanelUserRow, StoreOption } from './models/panel-user.model';
import { apiErrorMessage } from '../../core/services/api.service';

interface PanelUsersState {
  items: PanelUserRow[];
  stores: StoreOption[];
  loading: boolean;
  storesLoading: boolean;
  error: string | null;
  reloadToken: number;
}

const initialState: PanelUsersState = {
  items: [],
  stores: [],
  loading: false,
  storesLoading: false,
  error: null,
  reloadToken: 0,
};

export const PanelUsersStore = signalStore(
  withState(initialState),
  withComputed(({ items }) => ({
    count: computed(() => items().length),
  })),
  withMethods(
    (store, api = inject(PanelUsersApiService), storesApi = inject(StoresApiService)) => ({
      refresh(): void {
        patchState(store, { reloadToken: store.reloadToken() + 1 });
      },
      invalidate(): void {
        patchState(store, { reloadToken: store.reloadToken() + 1 });
      },
      toggleActive(user: PanelUserRow): void {
        const next = !user.isActive;
        api.setActive(user.id, next).subscribe({
          next: () => patchState(store, { reloadToken: store.reloadToken() + 1 }),
        });
      },
      loadStores: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { storesLoading: true })),
          switchMap(() => storesApi.listActive()),
          tapResponse({
            next: (stores) => patchState(store, { stores, storesLoading: false }),
            error: () => patchState(store, { stores: [], storesLoading: false }),
          }),
        ),
      ),
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() => api.list()),
          tapResponse({
            next: (list) => patchState(store, { items: list, loading: false }),
            error: (err) =>
              patchState(store, {
                items: [],
                loading: false,
                error: apiErrorMessage(err),
              }),
          }),
        ),
      ),
    }),
  ),
);
