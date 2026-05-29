import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface StoreOption {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class StoresApiService {
  private readonly api = inject(ApiService);

  listActive(): Observable<StoreOption[]> {
    return this.api.get<Record<string, unknown>[]>('/api/stores').pipe(
      map((rows) =>
        (Array.isArray(rows) ? rows : [])
          .map((r) => ({
            id: Number(r['id'] ?? 0),
            name: String(r['name'] ?? '').trim() || `#${r['id']}`,
          }))
          .filter((s) => s.id > 0)
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
      ),
    );
  }
}
