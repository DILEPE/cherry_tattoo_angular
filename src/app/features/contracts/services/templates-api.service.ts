import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ContractTemplate, ContractTemplateWritePayload } from '../models/contract-template.model';
import { mapContractTemplate } from '../models/contract-template.mapper';

@Injectable({ providedIn: 'root' })
export class TemplatesApiService {
  private readonly api = inject(ApiService);

  list(params: { onlyActive: boolean; contractKind?: string }): Observable<ContractTemplate[]> {
    const query: Record<string, string | boolean> = {
      only_active: params.onlyActive,
    };
    if (params.contractKind?.trim()) {
      query['contract_kind'] = params.contractKind.trim();
    }
    return this.api
      .get<Record<string, unknown>[]>('/api/templates/', query)
      .pipe(map((rows) => (Array.isArray(rows) ? rows : []).map((r) => mapContractTemplate(r))));
  }

  getById(templateId: number): Observable<ContractTemplate> {
    return this.api
      .get<Record<string, unknown>>(`/api/templates/${templateId}`)
      .pipe(map((r) => mapContractTemplate(r)));
  }

  create(body: ContractTemplateWritePayload): Observable<number> {
    return this.api
      .post<{ id?: number }>('/api/templates/', body)
      .pipe(map((r) => Number(r?.id ?? 0)));
  }

  update(templateId: number, body: ContractTemplateWritePayload): Observable<unknown> {
    return this.api.put(`/api/templates/${templateId}`, body);
  }

  delete(templateId: number): Observable<unknown> {
    return this.api.delete(`/api/templates/${templateId}`);
  }
}
