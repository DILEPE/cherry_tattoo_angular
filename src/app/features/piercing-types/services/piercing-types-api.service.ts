import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PiercingTypeDetail,
  PiercingTypeRow,
  PiercingTypeUpdatePayload,
  PiercingTypeWritePayload,
} from '../models/piercing-type.model';
import { mapPiercingTypeDetail, mapPiercingTypeRow } from '../models/piercing-type.mapper';

@Injectable({ providedIn: 'root' })
export class PiercingTypesApiService {
  private readonly api = inject(ApiService);

  list(includeTattoo = true): Observable<PiercingTypeRow[]> {
    return this.api
      .get<Record<string, unknown>[]>('/api/procedure-consent-documents/', {
        include_tattoo: includeTattoo,
      })
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : [])
            .map((r) => mapPiercingTypeRow(r))
            .filter((r): r is PiercingTypeRow => !!r)
            .sort((a, b) => a.label.localeCompare(b.label, 'es')),
        ),
      );
  }

  getDetail(label: string): Observable<PiercingTypeDetail> {
    return this.api
      .get<Record<string, unknown>>(
        `/api/procedure-consent-documents/${encodeURIComponent(label)}`,
      )
      .pipe(
        map((raw) => {
          const detail = mapPiercingTypeDetail(raw);
          if (!detail) throw new Error('Respuesta inválida del PDF.');
          return detail;
        }),
      );
  }

  create(body: PiercingTypeWritePayload): Observable<{ survey_option_label: string }> {
    return this.api
      .post<{ survey_option_label?: string }>('/api/procedure-consent-documents/', body)
      .pipe(
        map((res) => ({
          survey_option_label: String(res?.survey_option_label ?? body.survey_option_label),
        })),
      );
  }

  update(label: string, body: PiercingTypeUpdatePayload): Observable<void> {
    return this.api.put<void>(
      `/api/procedure-consent-documents/${encodeURIComponent(label)}`,
      body,
    );
  }

  delete(label: string): Observable<void> {
    return this.api.delete<void>(
      `/api/procedure-consent-documents/${encodeURIComponent(label)}`,
    );
  }
}
