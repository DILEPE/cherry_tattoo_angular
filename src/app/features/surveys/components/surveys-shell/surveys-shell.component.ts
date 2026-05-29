import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { SurveysStore } from '../../surveys.store';
import { SurveysToolbarComponent } from '../surveys-toolbar/surveys-toolbar.component';
import { SurveysQuestionsListComponent } from '../surveys-questions-list/surveys-questions-list.component';
import { SurveysModalsHostComponent } from '../../dialogs/surveys-modals-host/surveys-modals-host.component';
import { UiStore } from '../../../../store/ui.store';
import { SurveyModalData } from '../../models/survey-modal.model';
import { SurveyQuestion } from '../../models/survey-question.model';

@Component({
  selector: 'app-surveys-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SurveysStore],
  imports: [
    SurveysToolbarComponent,
    SurveysQuestionsListComponent,
    SurveysModalsHostComponent,
  ],
  template: `
    <h2 class="sq-page-title">Encuesta de satisfacción</h2>
    <p class="sq-page-lead">
      Configura las preguntas que verá el cliente al firmar contrato. El orden de las preguntas
      activas define cómo aparecen en la encuesta.
    </p>
    <app-surveys-toolbar (create)="openCreate()" />
    <app-surveys-questions-list (edit)="openEdit($event)" (delete)="openDelete($event)" />
    <app-surveys-modals-host />
  `,
})
export class SurveysShellComponent {
  private readonly store = inject(SurveysStore);
  private readonly ui = inject(UiStore);

  private readonly _load = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openCreate(): void {
    this.ui.openModal('question-create', {} satisfies SurveyModalData);
  }

  openEdit(row: SurveyQuestion): void {
    this.ui.openModal('question-edit', {
      questionId: row.id,
      questionLabel: row.label,
    } satisfies SurveyModalData);
  }

  openDelete(row: SurveyQuestion): void {
    this.ui.openModal('question-delete', {
      questionId: row.id,
      questionLabel: row.label,
    } satisfies SurveyModalData);
  }
}
