import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PanelStaffOption } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class PanelStaffApiService {
  private readonly api = inject(ApiService);

  listAssignable(): Observable<PanelStaffOption[]> {
    return this.api
      .get<Record<string, unknown>[]>('/api/panel-users/assignable-for-appointments')
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : []).map((r) => {
            const id = Number(r['id'] ?? 0);
            const fn = String(r['first_name'] ?? '').trim();
            const ln = String(r['last_name'] ?? '').trim();
            const un = String(r['username'] ?? '').trim();
            const label =
              `${fn} ${ln}`.trim() || un || `#${id}`;
            return {
              id,
              username: un,
              firstName: fn,
              lastName: ln,
              role: String(r['role'] ?? ''),
              label: `${label} (@${un || id})`,
            };
          }),
        ),
      );
  }
}
