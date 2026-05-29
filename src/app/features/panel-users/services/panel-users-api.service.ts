import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PanelUserCreatePayload,
  PanelUserUpdatePayload,
} from '../models/panel-user.model';
import { mapPanelUser, parseModuleGrants } from '../models/panel-user.mapper';
import { PanelUserRow } from '../models/panel-user.model';
import { AssignablePanelModuleKey } from '../models/panel-user.model';

@Injectable({ providedIn: 'root' })
export class PanelUsersApiService {
  private readonly api = inject(ApiService);

  list(): Observable<PanelUserRow[]> {
    return this.api
      .get<Record<string, unknown>[]>('/api/panel-users/')
      .pipe(map((rows) => (Array.isArray(rows) ? rows : []).map((r) => mapPanelUser(r))));
  }

  getById(userId: number): Observable<PanelUserRow> {
    return this.api
      .get<Record<string, unknown>>(`/api/panel-users/${userId}`)
      .pipe(map((r) => mapPanelUser(r)));
  }

  getModuleGrants(userId: number): Observable<AssignablePanelModuleKey[]> {
    return this.api
      .get<string[]>(`/api/panel-users/${userId}/modules`)
      .pipe(map((rows) => parseModuleGrants(rows)));
  }

  create(body: PanelUserCreatePayload): Observable<number> {
    return this.api
      .post<{ id?: number }>('/api/panel-users/', body)
      .pipe(map((r) => Number(r?.id ?? 0)));
  }

  update(userId: number, body: PanelUserUpdatePayload): Observable<unknown> {
    return this.api.patch(`/api/panel-users/${userId}`, body);
  }

  setModules(userId: number, modules: AssignablePanelModuleKey[]): Observable<unknown> {
    return this.api.put(`/api/panel-users/${userId}/modules`, { modules });
  }

  setActive(userId: number, isActive: boolean): Observable<unknown> {
    return this.api.patch(`/api/panel-users/${userId}`, { is_active: isActive });
  }
}
