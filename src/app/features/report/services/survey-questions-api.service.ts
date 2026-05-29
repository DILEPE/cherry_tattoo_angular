import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SurveyQuestionStatRow, SurveyQuestionTextResponseRow } from '../models/survey-stats.model';

@Injectable({ providedIn: 'root' })
export class SurveyQuestionsApiService {
  private readonly api = inject(ApiService);

  statsSummary(
    params?: Record<string, string>,
  ): Observable<SurveyQuestionStatRow[]> {
    return this.api.get<SurveyQuestionStatRow[]>(
      '/api/survey-questions/stats/summary',
      params ?? undefined,
    );
  }

  textResponses(
    questionId: number,
    params?: Record<string, string>,
  ): Observable<SurveyQuestionTextResponseRow[]> {
    return this.api.get<SurveyQuestionTextResponseRow[]>(
      `/api/survey-questions/${questionId}/stats/text-responses`,
      params ?? undefined,
    );
  }
}
