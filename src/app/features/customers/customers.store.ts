import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { CustomersApiService } from './services/customers-api.service';
import { Customer } from './models/customer.model';
import { apiErrorMessage } from '../../core/services/api.service';

interface CustomersState {
  items: Customer[];
  total: number;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  searchInput: string;
  page: number;
  pageSize: number;
  reloadToken: number;
}

const initialState: CustomersState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  searchQuery: '',
  searchInput: '',
  page: 0,
  pageSize: 20,
  reloadToken: 0,
};

export const CustomersStore = signalStore(
  withState(initialState),
  withComputed(({ total, pageSize, page }) => {
    const totalPages = computed(() => {
      const size = Math.max(1, pageSize());
      return Math.max(1, Math.ceil(total() / size));
    });
    return { totalPages };
  }),
  withMethods((store, api = inject(CustomersApiService)) => ({
    setSearchInput(value: string): void {
      patchState(store, { searchInput: value });
    },
    applySearch(): void {
      patchState(store, {
        searchQuery: store.searchInput().trim(),
        page: 0,
        reloadToken: store.reloadToken() + 1,
      });
    },
    refresh(): void {
      patchState(store, {
        searchQuery: store.searchInput().trim(),
        reloadToken: store.reloadToken() + 1,
      });
    },
    setPageSize(size: number): void {
      patchState(store, { pageSize: size, page: 0, reloadToken: store.reloadToken() + 1 });
    },
    prevPage(): void {
      patchState(store, { page: Math.max(0, store.page() - 1), reloadToken: store.reloadToken() + 1 });
    },
    nextPage(): void {
      const max = Math.max(0, Math.ceil(store.total() / Math.max(1, store.pageSize())) - 1);
      patchState(store, {
        page: Math.min(max, store.page() + 1),
        reloadToken: store.reloadToken() + 1,
      });
    },
    invalidate(): void {
      patchState(store, { reloadToken: store.reloadToken() + 1 });
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const limit = store.pageSize();
          const offset = store.page() * limit;
          return api.list({
            limit,
            offset,
            search: store.searchQuery() || undefined,
          });
        }),
        tapResponse({
          next: (res) =>
            patchState(store, {
              items: res.items,
              total: res.total,
              loading: false,
            }),
          error: (err) =>
            patchState(store, {
              items: [],
              total: 0,
              loading: false,
              error: apiErrorMessage(err),
            }),
        }),
      ),
    ),
  })),
);
