import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { map } from 'rxjs/operators';
import {
  AppointmentApiRow,
  AppointmentPayment,
  AppointmentReceipt,
} from '../models/appointment.model';
import {
  AppointmentSearchField,
  AppointmentSearchResponse,
} from '../models/appointment-search.model';
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

  search(params: {
    field: AppointmentSearchField;
    q: string;
    limit: number;
    offset: number;
    assignedPanelUserId?: number | null;
  }): Observable<AppointmentSearchResponse> {
    const query: Record<string, string | number> = {
      field: params.field,
      q: params.q,
      limit: params.limit,
      offset: params.offset,
    };
    if (params.assignedPanelUserId != null && params.assignedPanelUserId > 0) {
      query['assigned_panel_user_id'] = params.assignedPanelUserId;
    }
    return this.api.get<AppointmentSearchResponse>('/api/appointments/search', query);
  }

  patchStatus(
    appointmentId: number,
    status: string,
    onCancelAbono?: 'credito_cliente',
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

  patchMeta(
    appointmentId: number,
    params: {
      assignedPanelUserId?: number | null;
      isPriority: boolean;
      detail?: string | null;
    },
  ): Observable<unknown> {
    const body: Record<string, unknown> = { is_priority: params.isPriority };
    if (params.assignedPanelUserId != null) {
      body['assigned_panel_user_id'] = params.assignedPanelUserId;
    }
    if (params.detail != null) {
      body['detail'] = params.detail;
    }
    return this.api.patch(`/api/appointments/${appointmentId}/meta`, body);
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
    paidOn?: string | null,
  ): Observable<unknown> {
    const body: Record<string, unknown> = { amount };
    if (note) body['note'] = note;
    if (paidOn) body['paid_on'] = paidOn;
    return this.api.post(`/api/appointments/${appointmentId}/payments`, body);
  }

  patchPayment(
    appointmentId: number,
    paymentId: number,
    amount: number,
    paidOn?: string | null,
  ): Observable<unknown> {
    const body: Record<string, unknown> = { amount };
    if (paidOn) body['paid_on'] = paidOn;
    return this.api.patch(
      `/api/appointments/${appointmentId}/payments/${paymentId}`,
      body,
    );
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

  create(payload: Record<string, unknown>): Observable<{ id?: number; message?: string }> {
    return this.api.post<{ id?: number; message?: string }>('/api/appointments', payload);
  }

  /** Mapa id cita → tipo de perforación (encuesta), para reporte financiero. */
  getWorkPerformedLabels(appointmentIds: number[]): Observable<Record<number, string>> {
    const ids = [...new Set(appointmentIds.filter((id) => id > 0))].sort((a, b) => a - b);
    if (!ids.length) {
      return of({});
    }
    return this.api
      .get<Record<string, string>>('/api/appointments/work-performed-labels', {
        ids: ids.join(','),
      })
      .pipe(
        map((data) => {
          const out: Record<number, string> = {};
          for (const [key, value] of Object.entries(data ?? {})) {
            const id = Number(key);
            const text = String(value ?? '').trim();
            if (id > 0 && text) {
              out[id] = text;
            }
          }
          return out;
        }),
      );
  }
}
