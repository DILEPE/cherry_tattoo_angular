import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SurveyQuestion, SurveyQuestionWritePayload } from '../models/survey-question.model';
import { mapDeletionImpact, mapSurveyQuestion } from '../models/survey-question.mapper';

@Injectable({ providedIn: 'root' })
export class SurveyQuestionsAdminApiService {
  private readonly api = inject(ApiService);

  list(includeInactive = true): Observable<SurveyQuestion[]> {
    return this.api
      .get<Record<string, unknown>[]>('/api/survey-questions/', {
        include_inactive: includeInactive,
      })
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : []).map((r) => mapSurveyQuestion(r)),
        ),
      );
  }

  deletionImpact(questionId: number): Observable<{
    questionId: number;
    label: string;
    registeredAnswers: number;
  }> {
    return this.api
      .get<Record<string, unknown>>(`/api/survey-questions/${questionId}/deletion-impact`)
      .pipe(map((r) => mapDeletionImpact(r)));
  }

  create(body: SurveyQuestionWritePayload): Observable<number> {
    return this.api
      .post<{ id?: number }>('/api/survey-questions/', body)
      .pipe(map((r) => Number(r?.id ?? 0)));
  }

  update(questionId: number, body: Partial<SurveyQuestionWritePayload>): Observable<unknown> {
    return this.api.put(`/api/survey-questions/${questionId}`, body);
  }

  delete(questionId: number): Observable<unknown> {
    return this.api.delete(`/api/survey-questions/${questionId}`);
  }

  swapSortOrder(a: SurveyQuestion, b: SurveyQuestion): Observable<void> {
    const sa = a.sortOrder;
    const sb = b.sortOrder;
    const [newSa, newSb] =
      sa !== sb ? [sb, sa] : [Math.min(sa, sb), Math.max(sa, sb) + 1];
    return new Observable<void>((subscriber) => {
      this.update(a.id, { sort_order: newSa }).subscribe({
        next: () => {
          this.update(b.id, { sort_order: newSb }).subscribe({
            next: () => {
              subscriber.next();
              subscriber.complete();
            },
            error: (e) => subscriber.error(e),
          });
        },
        error: (e) => subscriber.error(e),
      });
    });
  }
}
