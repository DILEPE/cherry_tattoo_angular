import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { map } from 'rxjs/operators';
import {
  AppointmentApiRow,
  AppointmentPayment,
  AppointmentReceipt,
} from '../models/appointment.model';
import { mapPayment, mapReceipt } from '../models/appointment.mapper';

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  private readonly api = inject(ApiService);

  list(assignedPanelUserId?: number | null): Observable<AppointmentApiRow[]> {
    const params =
      assignedPanelUserId != null
        ? { assigned_panel_user_id: assignedPanelUserId }
        : undefined;
    return this.api.get<AppointmentApiRow[]>('/api/appointments', params);
  }

  get(appointmentId: number): Observable<AppointmentApiRow> {
    return this.api.get<AppointmentApiRow>(`/api/appointments/${appointmentId}`);
  }

  patchStatus(
    appointmentId: number,
    status: string,
    onCancelAbono?: 'credito_cliente' | 'devolucion',
  ): Observable<unknown> {
    const body: Record<string, string> = { status };
    if (status === 'Cancelada' && onCancelAbono) {
      body['on_cancel_abono'] = onCancelAbono;
    }
    return this.api.patch(`/api/appointments/${appointmentId}/status`, body);
  }

  patchReschedule(
    appointmentId: number,
    dateValue: string,
    detail?: string | null,
  ): Observable<unknown> {
    return this.api.patch(`/api/appointments/${appointmentId}/reschedule`, {
      date: dateValue,
      detail: detail ?? null,
    });
  }

  patchFinancials(
    appointmentId: number,
    totalAmount: number,
    deposit: number,
    pendingBalance: number,
  ): Observable<unknown> {
    return this.api.patch(`/api/appointments/${appointmentId}/financials`, {
      total_amount: totalAmount,
      deposit,
      pending_balance: pendingBalance,
    });
  }

  getPayments(appointmentId: number): Observable<AppointmentPayment[]> {
    return this.api
      .get<Record<string, unknown>[]>(`/api/appointments/${appointmentId}/payments`)
      .pipe(map((rows) => (Array.isArray(rows) ? rows.map(mapPayment) : [])));
  }

  postPayment(
    appointmentId: number,
    amount: number,
    note?: string | null,
  ): Observable<unknown> {
    const body: Record<string, unknown> = { amount };
    if (note) body['note'] = note;
    return this.api.post(`/api/appointments/${appointmentId}/payments`, body);
  }

  getReceipts(appointmentId: number): Observable<AppointmentReceipt[]> {
    return this.api
      .get<Record<string, unknown>[]>(`/api/appointments/${appointmentId}/receipts`)
      .pipe(map((rows) => (Array.isArray(rows) ? rows.map(mapReceipt) : [])));
  }

  getReceiptPdf(appointmentId: number, receiptId: number): Observable<Blob> {
    return this.api.getBlob(
      `/api/appointments/${appointmentId}/receipts/${receiptId}/pdf`,
    );
  }

  resendReceipt(appointmentId: number, receiptId: number): Observable<unknown> {
    return this.api.post(
      `/api/appointments/${appointmentId}/receipts/${receiptId}/resend`,
    );
  }
}
