import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { AppointmentsApiService } from './services/appointments-api.service';
import {
  Appointment,
  AppointmentFilters,
} from './models/appointment.model';
import {
  filterAppointments,
  mapAppointment,
  uniqueServices,
} from './models/appointment.mapper';
import {
  AppointmentsViewMode,
  CalendarMonthState,
} from './models/calendar.model';
import {
  buildClientHistoryCounts,
  currentCalendarMonth,
  groupAppointmentsByDay,
  shiftCalendarMonth,
} from './models/calendar.mapper';
import { apiErrorMessage } from '../../core/services/api.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface AppointmentsState {
  items: Appointment[];
  loading: boolean;
  error: string | null;
  assignedUserId: number | null;
  filters: AppointmentFilters;
  reloadToken: number;
  viewMode: AppointmentsViewMode;
  calendarMonth: CalendarMonthState;
}

const initialFilters: AppointmentFilters = {
  nameSubstr: '',
  service: 'Todos',
  status: 'Todos',
};

const initialState: AppointmentsState = {
  items: [],
  loading: false,
  error: null,
  assignedUserId: null,
  filters: { ...initialFilters },
  reloadToken: 0,
  viewMode: 'calendar',
  calendarMonth: currentCalendarMonth(),
};

export const AppointmentsStore = signalStore(
  withState(initialState),
  withComputed(({ items, filters }) => {
    const filteredItems = computed(() => filterAppointments(items(), filters()));
    const clientHistoryCounts = computed(() => buildClientHistoryCounts(items()));
    const appointmentsByDay = computed(() =>
      groupAppointmentsByDay(filteredItems()),
    );
    return {
      filteredItems,
      clientHistoryCounts,
      appointmentsByDay,
      serviceOptions: computed(() => uniqueServices(items())),
      hasItems: computed(() => items().length > 0),
    };
  }),
  withMethods(
    (
      store,
      api = inject(AppointmentsApiService),
      toast = inject(ToastService),
    ) => ({
      setViewMode(mode: AppointmentsViewMode): void {
        patchState(store, { viewMode: mode });
      },
      prevCalendarMonth(): void {
        patchState(store, {
          calendarMonth: shiftCalendarMonth(store.calendarMonth(), -1),
        });
      },
      nextCalendarMonth(): void {
        patchState(store, {
          calendarMonth: shiftCalendarMonth(store.calendarMonth(), 1),
        });
      },
      goToTodayMonth(): void {
        patchState(store, { calendarMonth: currentCalendarMonth() });
      },
      setAssignedUserId(id: number | null): void {
        patchState(store, { assignedUserId: id, reloadToken: store.reloadToken() + 1 });
      },
      setFilters(partial: Partial<AppointmentFilters>): void {
        patchState(store, { filters: { ...store.filters(), ...partial } });
      },
      resetFilters(): void {
        patchState(store, { filters: { ...initialFilters } });
      },
      invalidate(): void {
        patchState(store, { reloadToken: store.reloadToken() + 1 });
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
