import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { PiercingTypesApiService } from './services/piercing-types-api.service';
import { PiercingTypeRow } from './models/piercing-type.model';
import { apiErrorMessage } from '../../core/services/api.service';

interface PiercingTypesState {
  items: PiercingTypeRow[];
  loading: boolean;
  error: string | null;
  reloadToken: number;
}

const initialState: PiercingTypesState = {
  items: [],
  loading: false,
  error: null,
  reloadToken: 0,
};

export const PiercingTypesStore = signalStore(
  withState(initialState),
  withComputed(({ items }) => ({
    count: computed(() => items().length),
  })),
  withMethods((store, api = inject(PiercingTypesApiService)) => ({
    invalidate(): void {
      patchState(store, { reloadToken: store.reloadToken() + 1 });
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => api.list(true)),
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
