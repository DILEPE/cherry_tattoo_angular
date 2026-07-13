import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap, of, map, catchError } from 'rxjs';
import { AppointmentsApiService } from './services/appointments-api.service';
import {
  Appointment,
  AppointmentApiRow,
  AppointmentFilters,
} from './models/appointment.model';
import {
  filterAppointments,
  filterTechnicianAgenda,
  mapAppointment,
  uniqueServices,
} from './models/appointment.mapper';
import { piercingAppointmentIdsForLabels } from './models/piercing-type-catalog';
import { isTechnicianRole } from '../../core/utils/panel-roles';
import { AppStore } from '../../store/app.store';
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
import { LoadingService } from '../../core/services/loading.service';
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
  gotoDateIso: string;
  listPage: number;
  listPageSize: number;
  /** appointmentId → etiqueta anatómica (encuesta). */
  piercingTypeLabels: Record<number, string>;
}

const initialFilters: AppointmentFilters = {
  nameSubstr: '',
  service: 'Todos',
  status: 'Todos',
  storeId: 0,
  fromDate: '',
  toDate: '',
  piercingWorkKind: 'Todos',
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
  gotoDateIso: dateToIsoLocal(new Date()),
  listPage: 0,
  listPageSize: 10,
  piercingTypeLabels: {},
};

export const AppointmentsStore = signalStore(
  withState(initialState),
  withComputed((store, appStore = inject(AppStore)) => {
    const filteredItems = computed(() => {
      let rows = filterAppointments(
        store.items(),
        store.filters(),
        store.piercingTypeLabels(),
      );
      const role = appStore.user()?.role ?? '';
      if (isTechnicianRole(role)) {
        rows = filterTechnicianAgenda(rows);
      }
      return rows;
    });
    const listTotalPages = computed(() => {
      const total = filteredItems().length;
      const size = Math.max(1, store.listPageSize());
      return Math.max(1, Math.ceil(total / size));
    });
    const paginatedListItems = computed(() => {
      const all = filteredItems();
      const size = store.listPageSize();
      const pages = Math.max(1, Math.ceil(all.length / size) || 1);
      const page = Math.min(store.listPage(), pages - 1);
      const start = page * size;
      return all.slice(start, start + size);
    });
    const clientHistoryCounts = computed(() => buildClientHistoryCounts(store.items()));
    const appointmentsByDay = computed(() =>
      groupAppointmentsByDay(filteredItems()),
    );
    return {
      filteredItems,
      paginatedListItems,
      listTotalPages,
      clientHistoryCounts,
      appointmentsByDay,
      serviceOptions: computed(() => uniqueServices(store.items())),
      hasItems: computed(() => store.items().length > 0),
      isTechnicianAgenda: computed(() => isTechnicianRole(appStore.user()?.role ?? '')),
    };
  }),
  withMethods(
    (
      store,
      api = inject(AppointmentsApiService),
      toast = inject(ToastService),
      loading = inject(LoadingService),
    ) => ({
      setViewMode(mode: AppointmentsViewMode): void {
        patchState(store, { viewMode: mode });
      },
      setCalendarPeriod(period: CalendarPeriod): void {
        let next = period;
        if (next === 'team' && store.assignedUserId() != null && store.assignedUserId()! > 0) {
          next = 'month';
        }
        if (next === 'week' && store.calendarPeriod() !== 'week') {
          const { year, month } = store.calendarMonth();
          const anchor = new Date(year, month - 1, 1);
          patchState(store, {
            calendarPeriod: next,
            weekMondayIso: dateToIsoLocal(weekMonday(anchor)),
          });
          return;
        }
        patchState(store, { calendarPeriod: next });
      },
      setGotoDateIso(iso: string): void {
        patchState(store, { gotoDateIso: iso });
      },
      goToSelectedWeek(): void {
        const d = isoToLocalDate(store.gotoDateIso());
        patchState(store, {
          calendarPeriod: 'week',
          weekMondayIso: dateToIsoLocal(weekMonday(d)),
        });
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
        if (store.assignedUserId() === id) {
          if (id != null && id > 0 && store.calendarPeriod() === 'team') {
            patchState(store, { calendarPeriod: 'month' });
          }
          return;
        }
        const patch: Partial<AppointmentsState> = {
          assignedUserId: id,
          reloadToken: store.reloadToken() + 1,
        };
        if (id != null && id > 0 && store.calendarPeriod() === 'team') {
          patch.calendarPeriod = 'month';
        }
        patchState(store, patch);
      },
      setFilters(partial: Partial<AppointmentFilters>): void {
        loading.pulse('Aplicando filtros…');
        patchState(store, {
          filters: { ...store.filters(), ...partial },
          listPage: 0,
        });
      },
      resetFilters(): void {
        loading.pulse('Aplicando filtros…');
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
      mergeAppointment(raw: AppointmentApiRow): void {
        const appt = mapAppointment(raw);
        const items = [...store.items()];
        const idx = items.findIndex((a) => a.id === appt.id);
        if (idx >= 0) items[idx] = appt;
        else items.unshift(appt);
        patchState(store, { items });
      },
      focusCalendarWeek(date: Date): void {
        patchState(store, {
          viewMode: 'calendar',
          calendarPeriod: 'week',
          weekMondayIso: dateToIsoLocal(weekMonday(date)),
          gotoDateIso: dateToIsoLocal(date),
          calendarMonth: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          },
        });
      },
      load: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, { loading: true, error: null, piercingTypeLabels: {} }),
          ),
          switchMap(() =>
            api.list(store.assignedUserId()).pipe(
              switchMap((rows) => {
                const items = rows.map(mapAppointment);
                const ids = piercingAppointmentIdsForLabels(items);
                return api.getWorkPerformedLabels(ids).pipe(
                  map((piercingTypeLabels) => ({ items, piercingTypeLabels })),
                  catchError(() => of({ items, piercingTypeLabels: {} as Record<number, string> })),
                );
              }),
              tapResponse({
                next: ({ items, piercingTypeLabels }) =>
                  patchState(store, {
                    items,
                    piercingTypeLabels,
                    loading: false,
                  }),
                error: (err) => {
                  const msg = apiErrorMessage(err);
                  patchState(store, {
                    items: [],
                    piercingTypeLabels: {},
                    loading: false,
                    error: msg,
                  });
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
