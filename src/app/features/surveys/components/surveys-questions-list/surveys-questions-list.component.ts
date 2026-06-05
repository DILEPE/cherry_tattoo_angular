import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { SurveysStore } from '../../surveys.store';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import {
  SURVEY_SCOPE_LABEL_ES,
  SURVEY_TYPE_LABEL_ES,
  SurveyQuestion,
} from '../../models/survey-question.model';
import { surveyQuestionPreview } from '../../models/survey-preview.util';

@Component({
  selector: 'app-surveys-questions-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, AppButtonComponent, AppIconActionButtonComponent],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="6" />
    } @else if (store.error()) {
      <p class="form-field__error">{{ store.error() }}</p>
    } @else {
      @if (!store.active().length) {
        <p class="empty-state sq-empty">
          La encuesta está vacía. Cuando añadas preguntas activas, aquí verás una vista previa de
          cómo las verá el cliente al firmar.
        </p>
      } @else {
        <p class="sq-list-meta">
          {{ store.active().length }} pregunta(s) activa(s) · usa ↑ ↓ para cambiar el orden
        </p>
        <div class="sq-cards">
          @for (q of store.active(); track q.id; let i = $index) {
            <article class="sq-card">
              <div class="sq-card__body">
                <h3 class="sq-card__label">{{ q.label }}</h3>
                @if (preview(q); as prev) {
                  <p class="sq-card__preview">{{ prev }}</p>
                }
                <p class="sq-card__meta">
                  {{ scopeLabel(q.contractKind) }} · {{ typeLabel(q.questionType) }}
                </p>
              </div>
              <div class="sq-card__actions">
                <app-button
                  variant="ghost"
                  [disabled]="i === 0 || store.reordering()"
                  title="Subir"
                  (clicked)="store.moveUp(q)"
                >
                  ↑
                </app-button>
                <app-button
                  variant="ghost"
                  [disabled]="i === store.active().length - 1 || store.reordering()"
                  title="Bajar"
                  (clicked)="store.moveDown(q)"
                >
                  ↓
                </app-button>
                <button appIconAction="edit" title="Editar" (click)="edit.emit(q)"></button>
                <button appIconAction="trash" title="Eliminar" (click)="delete.emit(q)"></button>
              </div>
            </article>
          }
        </div>
      }

      @if (store.inactive().length) {
        <details class="sq-inactive">
          <summary>
            Preguntas inactivas ({{ store.inactive().length }}) — no aparecen en la encuesta
          </summary>
          <p class="sq-inactive__hint">Actívalas para incluirlas en la encuesta al firmar contrato.</p>
          <div class="sq-cards">
            @for (q of store.inactive(); track q.id) {
              <article class="sq-card sq-card--inactive">
                <div class="sq-card__body">
                  <h3 class="sq-card__label">{{ q.label }}</h3>
                  @if (preview(q); as prev) {
                    <p class="sq-card__preview">{{ prev }}</p>
                  }
                  <p class="sq-card__meta">
                    {{ scopeLabel(q.contractKind) }} · {{ typeLabel(q.questionType) }}
                  </p>
                </div>
                <div class="sq-card__actions sq-card__actions--inactive">
                  <app-button variant="primary" (clicked)="store.activate(q)">Activar</app-button>
                  <app-button variant="ghost" (clicked)="delete.emit(q)">Borrar</app-button>
                </div>
              </article>
            }
          </div>
        </details>
      }
    }
  `,
})
export class SurveysQuestionsListComponent {
  protected readonly store = inject(SurveysStore);
  protected readonly preview = surveyQuestionPreview;
  protected readonly scopeLabel = (s: keyof typeof SURVEY_SCOPE_LABEL_ES) =>
    SURVEY_SCOPE_LABEL_ES[s];
  protected readonly typeLabel = (t: string) => SURVEY_TYPE_LABEL_ES[t] ?? t;

  readonly edit = output<SurveyQuestion>();
  readonly delete = output<SurveyQuestion>();
}
