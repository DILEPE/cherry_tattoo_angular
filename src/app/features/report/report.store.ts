import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { AppointmentsApiService } from '../appointments/services/appointments-api.service';
import {
  Appointment,
  AppointmentFilters,
} from '../appointments/models/appointment.model';
import {
  filterAppointments,
  mapAppointment,
  uniqueServices,
} from '../appointments/models/appointment.mapper';
import { apiErrorMessage } from '../../core/services/api.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

export type ReportSubsection = 'finances' | 'surveys';

interface ReportState {
  items: Appointment[];
  loading: boolean;
  error: string | null;
  assignedUserId: number | null;
  filters: AppointmentFilters;
  reloadToken: number;
  subsection: ReportSubsection;
  page: number;
  pageSize: number;
}

const initialFilters: AppointmentFilters = {
  nameSubstr: '',
  service: 'Todos',
  status: 'Todos',
  storeId: 0,
  fromDate: '',
  toDate: '',
};

const initialState: ReportState = {
  items: [],
  loading: false,
  error: null,
  assignedUserId: null,
  filters: { ...initialFilters },
  reloadToken: 0,
  subsection: 'finances',
  page: 0,
  pageSize: 10,
};

export const ReportStore = signalStore(
  withState(initialState),
  withComputed(({ items, filters, page, pageSize }) => {
    const filteredItems = computed(() => filterAppointments(items(), filters()));
    const totals = computed(() => {
      let trabajo = 0;
      let abonado = 0;
      let pendiente = 0;
      for (const r of filteredItems()) {
        trabajo += r.financials.total;
        abonado += r.financials.deposit;
        pendiente += r.financials.pending;
      }
      return { trabajo, abonado, pendiente };
    });
    const totalPages = computed(() => {
      const n = filteredItems().length;
      const size = Math.max(1, pageSize());
      return Math.max(1, Math.ceil(n / size));
    });
    const pageRows = computed(() => {
      const all = filteredItems();
      const size = pageSize();
      const pages = Math.max(1, Math.ceil(all.length / size) || 1);
      const p = Math.min(page(), pages - 1);
      return all.slice(p * size, p * size + size);
    });
    return {
      filteredItems,
      totals,
      totalPages,
      pageRows,
      serviceOptions: computed(() => uniqueServices(items())),
    };
  }),
  withMethods(
    (
      store,
      api = inject(AppointmentsApiService),
      toast = inject(ToastService),
    ) => ({
      setSubsection(s: ReportSubsection): void {
        patchState(store, { subsection: s });
      },
      setAssignedUserId(id: number | null): void {
        patchState(store, { assignedUserId: id, reloadToken: store.reloadToken() + 1 });
      },
      setFilters(partial: Partial<AppointmentFilters>): void {
        patchState(store, {
          filters: { ...store.filters(), ...partial },
          page: 0,
        });
      },
      resetFilters(): void {
        patchState(store, { filters: { ...initialFilters }, page: 0 });
      },
      invalidate(): void {
        patchState(store, { reloadToken: store.reloadToken() + 1 });
      },
      prevPage(): void {
        patchState(store, { page: Math.max(0, store.page() - 1) });
      },
      nextPage(): void {
        patchState(store, { page: Math.min(store.totalPages() - 1, store.page() + 1) });
      },
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            api.list(store.assignedUserId()).pipe(
              tapResponse({
                next: (rows) =>
                  patchState(store, {
                    items: rows.map(mapAppointment),
                    loading: false,
                  }),
                error: (err) => {
                  const msg = apiErrorMessage(err);
                  patchState(store, { items: [], loading: false, error: msg });
                  toast.error(msg);
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
