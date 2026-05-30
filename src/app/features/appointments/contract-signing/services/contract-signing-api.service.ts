import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { SurveyQuestion } from '../../../surveys/models/survey-question.model';
import { mapSurveyQuestion } from '../../../surveys/models/survey-question.mapper';

export interface ContractSignPayload {
  appointment_id: number;
  is_minor: boolean;
  health_data: Record<string, unknown>;
  signature: string;
  tutor_signature?: string | null;
  artist_signature?: string | null;
  tutor_document_front?: string | null;
  tutor_document_back?: string | null;
  contract_text?: string | null;
  template_id?: number | null;
}

export interface ContractArtistSignPayload {
  appointment_id: number;
  artist_signature: string;
}

export interface ContractLatestSummary {
  contractId: number;
  appointmentId: number;
  pendingArtistSignature: boolean;
  contractText: string;
}

export interface SurveySubmitPayload {
  appointment_id: number;
  would_recommend: boolean;
  answers: SurveyAnswerPayload[];
}

export interface SurveyAnswerPayload {
  question_id: number;
  rating?: number;
  yes_no?: boolean;
  text?: string;
  choices?: string[];
  number?: number;
}

@Injectable({ providedIn: 'root' })
export class ContractSigningApiService {
  private readonly api = inject(ApiService);

  listActiveSurveyQuestions(contractKind: string): Observable<SurveyQuestion[]> {
    return this.api
      .get<Record<string, unknown>[]>('/api/survey-questions/', {
        include_inactive: false,
        contract_kind: contractKind,
      })
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : [])
            .map((r) => mapSurveyQuestion(r))
            .filter((q) => q.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
        ),
      );
  }

  submitSurvey(body: SurveySubmitPayload): Observable<unknown> {
    return this.api.post('/api/surveys', body);
  }

  signContract(body: ContractSignPayload): Observable<{ message?: string }> {
    return this.api.post<{ message?: string }>('/api/contracts', body);
  }

  completeArtistSignature(body: ContractArtistSignPayload): Observable<{ message?: string }> {
    return this.api.post<{ message?: string }>('/api/contracts/complete-artist-signature', body);
  }

  latestSummary(appointmentId: number): Observable<ContractLatestSummary> {
    return this.api
      .get<Record<string, unknown>>(`/api/contracts/appointment/${appointmentId}/latest-summary`)
      .pipe(
        map((row) => ({
          contractId: Number(row['contract_id'] ?? 0),
          appointmentId: Number(row['appointment_id'] ?? appointmentId),
          pendingArtistSignature: Boolean(row['pending_artist_signature']),
          contractText: String(row['contract_text'] ?? ''),
        })),
      );
  }

  getContract(contractId: number): Observable<Record<string, unknown>> {
    return this.api.get<Record<string, unknown>>(`/api/contracts/${contractId}`);
  }
}
