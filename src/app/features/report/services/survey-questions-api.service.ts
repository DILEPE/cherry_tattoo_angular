import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SurveyQuestionStatRow } from '../models/survey-stats.model';

@Injectable({ providedIn: 'root' })
export class SurveyQuestionsApiService {
  private readonly api = inject(ApiService);

  statsSummary(): Observable<SurveyQuestionStatRow[]> {
    return this.api.get<SurveyQuestionStatRow[]>('/api/survey-questions/stats/summary');
  }
}
