import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Store, StoreOption, StoreWritePayload } from '../models/store.model';
import { mapStore, mapStoreOption } from '../models/store.mapper';

@Injectable({ providedIn: 'root' })
export class StoresApiService {
  private readonly api = inject(ApiService);

  list(includeInactive = false): Observable<Store[]> {
    const params = includeInactive ? { include_inactive: true } : undefined;
    return this.api.get<Record<string, unknown>[]>('/api/stores/', params).pipe(
      map((rows) =>
        (Array.isArray(rows) ? rows : [])
          .map((r) => mapStore(r))
          .filter((s) => s.id > 0)
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
      ),
    );
  }

  listActive(): Observable<StoreOption[]> {
    return this.list(false).pipe(
      map((rows) =>
        rows
          .filter((s) => s.isActive)
          .map((s) => ({ id: s.id, name: s.name, isActive: s.isActive })),
      ),
    );
  }

  getById(id: number): Observable<Store | null> {
    return this.api.get<Record<string, unknown>>(`/api/stores/${id}`).pipe(
      map((raw) => {
        const store = mapStore(raw);
        return store.id > 0 ? store : null;
      }),
    );
  }

  create(body: StoreWritePayload): Observable<{ id: number }> {
    return this.api.post<{ id?: number }>('/api/stores/', body).pipe(
      map((res) => ({ id: Number(res?.id ?? 0) })),
    );
  }

  update(id: number, body: StoreWritePayload): Observable<void> {
    return this.api.put<void>(`/api/stores/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/stores/${id}`);
  }
}
