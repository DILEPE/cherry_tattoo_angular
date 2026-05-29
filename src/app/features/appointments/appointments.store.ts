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
  CalendarPeriod,
} from './models/calendar.model';
import {
  buildClientHistoryCounts,
  currentCalendarMonth,
  groupAppointmentsByDay,
  shiftCalendarMonth,
} from './models/calendar.mapper';
import {
  currentWeekMondayIso,
  dateToIsoLocal,
  isoToLocalDate,
  weekMonday,
} from './models/week-schedule.mapper';
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
  calendarPeriod: CalendarPeriod;
  calendarMonth: CalendarMonthState;
  weekMondayIso: string;
  listPage: number;
  listPageSize: number;
}

const initialFilters: AppointmentFilters = {
  nameSubstr: '',
  service: 'Todos',
  status: 'Todos',
  fromDate: '',
  toDate: '',
};

const initialState: AppointmentsState = {
  items: [],
  loading: false,
  error: null,
  assignedUserId: null,
  filters: { ...initialFilters },
  reloadToken: 0,
  viewMode: 'calendar',
  calendarPeriod: 'month',
  calendarMonth: currentCalendarMonth(),
  weekMondayIso: currentWeekMondayIso(),
  listPage: 0,
  listPageSize: 10,
};

export const AppointmentsStore = signalStore(
  withState(initialState),
  withComputed(({ items, filters, listPage, listPageSize }) => {
    const filteredItems = computed(() => filterAppointments(items(), filters()));
    const listTotalPages = computed(() => {
      const total = filteredItems().length;
      const size = Math.max(1, listPageSize());
      return Math.max(1, Math.ceil(total / size));
    });
    const paginatedListItems = computed(() => {
      const all = filteredItems();
      const size = listPageSize();
      const pages = Math.max(1, Math.ceil(all.length / size) || 1);
      const page = Math.min(listPage(), pages - 1);
      const start = page * size;
      return all.slice(start, start + size);
    });
    const clientHistoryCounts = computed(() => buildClientHistoryCounts(items()));
    const appointmentsByDay = computed(() =>
      groupAppointmentsByDay(filteredItems()),
    );
    return {
      filteredItems,
      paginatedListItems,
      listTotalPages,
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
      setCalendarPeriod(period: CalendarPeriod): void {
        if (period === 'week' && store.calendarPeriod() !== 'week') {
          const { year, month } = store.calendarMonth();
          const anchor = new Date(year, month - 1, 1);
          patchState(store, {
            calendarPeriod: period,
            weekMondayIso: dateToIsoLocal(weekMonday(anchor)),
          });
          return;
        }
        patchState(store, { calendarPeriod: period });
      },
      prevWeek(): void {
        const m = isoToLocalDate(store.weekMondayIso());
        m.setDate(m.getDate() - 7);
        patchState(store, { weekMondayIso: dateToIsoLocal(m) });
      },
      nextWeek(): void {
        const m = isoToLocalDate(store.weekMondayIso());
        m.setDate(m.getDate() + 7);
        patchState(store, { weekMondayIso: dateToIsoLocal(m) });
      },
      goToTodayWeek(): void {
        patchState(store, { weekMondayIso: currentWeekMondayIso() });
      },
      goToWeekContaining(date: Date): void {
        patchState(store, {
          calendarPeriod: 'week',
          weekMondayIso: dateToIsoLocal(weekMonday(date)),
        });
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
        patchState(store, {
          filters: { ...store.filters(), ...partial },
          listPage: 0,
        });
      },
      resetFilters(): void {
        patchState(store, { filters: { ...initialFilters }, listPage: 0 });
      },
      setListPage(page: number): void {
        patchState(store, { listPage: Math.max(0, page) });
      },
      prevListPage(): void {
        patchState(store, { listPage: Math.max(0, store.listPage() - 1) });
      },
      nextListPage(): void {
        const max = store.listTotalPages() - 1;
        patchState(store, { listPage: Math.min(max, store.listPage() + 1) });
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
