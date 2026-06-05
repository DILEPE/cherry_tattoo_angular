import { computed, inject } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { tapResponse } from '@ngrx/operators';

import { pipe, switchMap, tap } from 'rxjs';

import { StoresApiService } from '../../core/services/stores-api.service';

import { Store } from '../../core/models/store.model';

import { apiErrorMessage } from '../../core/services/api.service';



interface StoresState {

  items: Store[];

  loading: boolean;

  error: string | null;

  reloadToken: number;

}



const initialState: StoresState = {

  items: [],

  loading: false,

  error: null,

  reloadToken: 0,

};



export const StoresStore = signalStore(

  withState(initialState),

  withComputed(({ items }) => ({

    count: computed(() => items().length),

  })),

  withMethods((store, api = inject(StoresApiService)) => ({

    refresh(): void {

      patchState(store, { reloadToken: store.reloadToken() + 1 });

    },

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


