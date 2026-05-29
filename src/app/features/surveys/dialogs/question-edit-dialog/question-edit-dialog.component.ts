import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SurveysStore } from '../../surveys.store';
import { SurveyQuestionsAdminApiService } from '../../services/survey-questions-admin-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { SurveyQuestionFormComponent } from '../../components/survey-question-form/survey-question-form.component';
import { SurveyQuestionFormValue } from '../../models/survey-question.model';
import { formToWritePayload } from '../../models/survey-question.mapper';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import {
  findSurveyQuestion,
  resolveSurveyQuestionModalId,
} from '../survey-modal.util';

@Component({
  selector: 'app-question-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SurveyQuestionFormComponent, AppButtonComponent],
  template: `
    @if (!question()) {
      <p class="form-field__error">No se encontró la pregunta.</p>
      <div class="appt-dialog-actions">
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      </div>
    } @else {
      <app-survey-question-form
        [initial]="question()!"
        [allowHistoricTextType]="true"
        [showActiveToggle]="true"
        (submitted)="save($event)"
      >
        <div actions class="appt-dialog-actions">
          <app-button type="submit" variant="primary" [loading]="saving()">Guardar cambios</app-button>
          <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
        </div>
      </app-survey-question-form>
    }
  `,
})
export class QuestionEditDialogComponent {
  private readonly api = inject(SurveyQuestionsAdminApiService);
  private readonly store = inject(SurveysStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);

  readonly question = computed(() => {
    const id = resolveSurveyQuestionModalId(this.ui);
    if (id <= 0) return null;
    return findSurveyQuestion(this.store.items(), id);
  });

  save(value: SurveyQuestionFormValue): void {
    const q = this.question();
    if (!q) return;
    this.saving.set(true);
    const body = formToWritePayload(value, {
      sortOrder: q.sortOrder,
      isActive: value.isActive,
    });
    this.api.update(q.id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Pregunta actualizada.');
        this.store.invalidate();
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  close(): void {
    this.ui.closeModal();
  }
}
