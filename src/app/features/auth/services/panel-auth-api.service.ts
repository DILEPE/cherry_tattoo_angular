import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { skipGlobalLoadingContext } from '../../../core/interceptors/loading.context';
import {
  PanelLoginResponse,
  PanelModuleKey,
  PanelModulesResponse,
} from '../models/panel-auth.model';

@Injectable({ providedIn: 'root' })
export class PanelAuthApiService {
  private readonly api = inject(ApiService);

  login(username: string, password: string): Observable<PanelLoginResponse> {
    return this.api.post<PanelLoginResponse>(
      '/api/panel-users/login',
      {
        username: username.trim().toLowerCase(),
        password,
      },
      { context: skipGlobalLoadingContext() },
    );
  }

  getEffectiveModules(userId: number): Observable<PanelModuleKey[]> {
    return this.api.get<string[] | PanelModulesResponse>(
      `/api/panel-users/${userId}/modules/effective`,
    ).pipe(
      map((resp) => {
        const raw = Array.isArray(resp)
          ? resp
          : (resp.modules ?? resp.module_keys ?? []);
        return raw.filter((k): k is PanelModuleKey => typeof k === 'string');
      }),
    );
  }
}
