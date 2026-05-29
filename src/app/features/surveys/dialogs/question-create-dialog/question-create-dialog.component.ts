import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SurveysStore } from '../../surveys.store';
import { SurveyQuestionsAdminApiService } from '../../services/survey-questions-admin-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { SurveyQuestionFormComponent } from '../../components/survey-question-form/survey-question-form.component';
import { SurveyQuestionFormValue } from '../../models/survey-question.model';
import { formToWritePayload } from '../../models/survey-question.mapper';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-question-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SurveyQuestionFormComponent, AppButtonComponent],
  template: `
    <app-survey-question-form (submitted)="save($event)">
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Guardar</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-survey-question-form>
  `,
})
export class QuestionCreateDialogComponent {
  private readonly api = inject(SurveyQuestionsAdminApiService);
  private readonly store = inject(SurveysStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);

  save(value: SurveyQuestionFormValue): void {
    this.saving.set(true);
    const body = formToWritePayload(value, { sortOrder: 9999, isActive: true });
    this.api.create(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Pregunta creada.');
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
