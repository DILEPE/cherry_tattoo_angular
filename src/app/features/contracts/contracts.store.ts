import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { TemplatesApiService } from './services/templates-api.service';
import { ContractTemplate } from './models/contract-template.model';
import { apiErrorMessage } from '../../core/services/api.service';

interface ContractsState {
  items: ContractTemplate[];
  loading: boolean;
  error: string | null;
  onlyActive: boolean;
  reloadToken: number;
}

const initialState: ContractsState = {
  items: [],
  loading: false,
  error: null,
  onlyActive: false,
  reloadToken: 0,
};

export const ContractsStore = signalStore(
  withState(initialState),
  withComputed(({ items }) => ({
    count: computed(() => items().length),
  })),
  withMethods((store, api = inject(TemplatesApiService)) => ({
    setOnlyActive(value: boolean): void {
      patchState(store, { onlyActive: value, reloadToken: store.reloadToken() + 1 });
    },
    refresh(): void {
      patchState(store, { reloadToken: store.reloadToken() + 1 });
    },
    invalidate(): void {
      patchState(store, { reloadToken: store.reloadToken() + 1 });
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => api.list({ onlyActive: store.onlyActive() })),
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
  })),
);
