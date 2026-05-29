import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SurveyQuestionsApiService } from '../../services/survey-questions-api.service';
import {
  CONTRACT_KIND_LABEL_ES,
  SURVEY_TYPE_LABEL_ES,
  SurveyQuestionStatRow,
} from '../../models/survey-stats.model';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-report-surveys',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, DecimalPipe],
  template: `
    <h3 class="report-section-title">Encuestas — satisfacción</h3>

    @if (loading()) {
      <app-skeleton [rows]="5" />
    } @else if (error()) {
      <p class="empty-state">{{ error() }}</p>
    } @else if (!rows().length) {
      <p class="empty-state">No hay preguntas registradas o la lista está vacía.</p>
    } @else {
      @for (row of rows(); track row.question_id) {
        <article class="report-survey-card">
          <h4 class="report-survey-title">
            {{ row.label }}
            <span class="report-survey-meta">
              · {{ typeLabel(row.question_type) }}
              · {{ kindLabel(row.contract_kind) }}
              · n = {{ row.response_count }}
            </span>
          </h4>
          @if (row.question_type === 'rating_1_5' && row.avg_rating != null) {
            <p class="report-survey-stat">Promedio (1–5): {{ row.avg_rating | number: '1.2-2' }}</p>
          }
          @if (row.question_type === 'yes_no') {
            <p class="report-survey-stat">
              Sí: {{ row.yes_count ?? 0 }} · No: {{ row.no_count ?? 0 }}
            </p>
          }
          @if (row.question_type === 'number' && row.avg_number != null) {
            <p class="report-survey-stat">
              Promedio numérico: {{ row.avg_number | number: '1.2-4' }}
            </p>
          }
          @if (breakdownEntries(row).length) {
            <table class="report-breakdown-table">
              <thead>
                <tr>
                  <th>Respuesta</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of breakdownEntries(row); track entry.key) {
                  <tr>
                    <td>{{ entry.key }}</td>
                    <td>{{ entry.count }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else if (
            row.question_type === 'text' ||
            row.question_type === 'textarea' ||
            row.question_type === 'text_short'
          ) {
            <p class="report-survey-caption">
              Texto libre — respuestas no vacías: {{ row.text_response_count ?? 0 }}
            </p>
          } @else if (row.response_count === 0) {
            <p class="report-survey-caption">Sin respuestas todavía.</p>
          }
        </article>
      }
    }
  `,
})
export class ReportSurveysComponent {
  private readonly api = inject(SurveyQuestionsApiService);
  private readonly errors = inject(ErrorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<SurveyQuestionStatRow[]>([]);

  constructor() {
    this.api
      .statsSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.rows.set(Array.isArray(list) ? list : []);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las estadísticas de encuesta.');
          this.errors.handle(err);
        },
      });
  }

  typeLabel(t: string): string {
    return SURVEY_TYPE_LABEL_ES[t] ?? t;
  }

  kindLabel(k: string): string {
    return CONTRACT_KIND_LABEL_ES[k] ?? k;
  }

  breakdownEntries(row: SurveyQuestionStatRow): { key: string; count: number }[] {
    let raw: Record<string, number> | null | undefined;
    if (row.question_type === 'rating_1_5') raw = row.rating_breakdown ?? undefined;
    else if (row.question_type === 'number') raw = row.number_breakdown ?? undefined;
    else if (['radio', 'select', 'checkbox'].includes(row.question_type)) {
      raw = row.choice_breakdown ?? undefined;
    } else if (row.question_type === 'yes_no') {
      return [
        { key: 'Sí', count: row.yes_count ?? 0 },
        { key: 'No', count: row.no_count ?? 0 },
      ].filter((x) => x.count > 0);
    }
    if (!raw) return [];
    return Object.entries(raw)
      .filter(([, v]) => Number(v) > 0)
      .map(([key, count]) => ({ key, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }
}
