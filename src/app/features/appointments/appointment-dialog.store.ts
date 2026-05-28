import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { Appointment, AppointmentPayment, AppointmentReceipt } from './models/appointment.model';
import { mapAppointment } from './models/appointment.mapper';
import { AppointmentsApiService } from './services/appointments-api.service';
import { apiErrorMessage } from '../../core/services/api.service';

interface AppointmentDialogState {
  appointmentId: number | null;
  appointment: Appointment | null;
  loading: boolean;
  error: string | null;
  payments: AppointmentPayment[];
  paymentsLoading: boolean;
  receipts: AppointmentReceipt[];
  receiptsLoading: boolean;
  saving: boolean;
}

const initialState: AppointmentDialogState = {
  appointmentId: null,
  appointment: null,
  loading: false,
  error: null,
  payments: [],
  paymentsLoading: false,
  receipts: [],
  receiptsLoading: false,
  saving: false,
};

export const AppointmentDialogStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(AppointmentsApiService)) => ({
    reset(): void {
      patchState(store, { ...initialState });
    },
    setSaving(saving: boolean): void {
      patchState(store, { saving });
    },
    loadAppointment: rxMethod<number>(
      pipe(
        tap((id) =>
          patchState(store, {
            appointmentId: id,
            loading: true,
            error: null,
            appointment: null,
          }),
        ),
        switchMap((id) =>
          api.get(id).pipe(
            tapResponse({
              next: (row) =>
                patchState(store, {
                  appointment: mapAppointment(row),
                  loading: false,
                }),
              error: (err) =>
                patchState(store, {
                  loading: false,
                  error: apiErrorMessage(err),
                }),
            }),
          ),
        ),
      ),
    ),
    loadPayments: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { paymentsLoading: true })),
        switchMap((id) =>
          api.getPayments(id).pipe(
            tapResponse({
              next: (payments) =>
                patchState(store, { payments, paymentsLoading: false }),
              error: () => patchState(store, { payments: [], paymentsLoading: false }),
            }),
          ),
        ),
      ),
    ),
    loadReceipts: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { receiptsLoading: true })),
        switchMap((id) =>
          api.getReceipts(id).pipe(
            tapResponse({
              next: (receipts) =>
                patchState(store, { receipts, receiptsLoading: false }),
              error: () => patchState(store, { receipts: [], receiptsLoading: false }),
            }),
          ),
        ),
      ),
    ),
    patchAppointmentLocal(appt: Appointment): void {
      patchState(store, { appointment: appt, appointmentId: appt.id });
    },
  })),
);
