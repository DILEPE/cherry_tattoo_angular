import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AppointmentApiRow } from '../models/appointment.model';

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
}
