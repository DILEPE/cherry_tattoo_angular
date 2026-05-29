import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { StoreOption } from '../models/panel-user.model';
import { mapStoreOption } from '../models/panel-user.mapper';

@Injectable({ providedIn: 'root' })
export class StoresApiService {
  private readonly api = inject(ApiService);

  listActive(): Observable<StoreOption[]> {
    return this.api.get<Record<string, unknown>[]>('/api/stores/').pipe(
      map((rows) =>
        (Array.isArray(rows) ? rows : [])
          .map((r) => mapStoreOption(r))
          .filter((s) => s.id > 0 && s.isActive),
      ),
    );
  }
}
