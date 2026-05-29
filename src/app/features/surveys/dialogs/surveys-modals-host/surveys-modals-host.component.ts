import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { QuestionCreateDialogComponent } from '../question-create-dialog/question-create-dialog.component';
import { QuestionEditDialogComponent } from '../question-edit-dialog/question-edit-dialog.component';
import { QuestionDeleteDialogComponent } from '../question-delete-dialog/question-delete-dialog.component';
import { resolveSurveyModalData } from '../survey-modal.util';

@Component({
  selector: 'app-surveys-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppModalComponent,
    QuestionCreateDialogComponent,
    QuestionEditDialogComponent,
    QuestionDeleteDialogComponent,
  ],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('question-create') {
        @defer (on immediate) {
          <app-modal
            title="Agregar pregunta"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            (closed)="ui.closeModal()"
          >
            <app-question-create-dialog />
          </app-modal>
        }
      }
      @case ('question-edit') {
        @defer (on immediate) {
          <app-modal
            [title]="'Editar: ' + (modalData().questionLabel || 'pregunta')"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            (closed)="ui.closeModal()"
          >
            <app-question-edit-dialog />
          </app-modal>
        }
      }
      @case ('question-delete') {
        @defer (on immediate) {
          <app-modal title="Eliminar pregunta" size="md" [isOpen]="true" (closed)="ui.closeModal()">
            <app-question-delete-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class SurveysModalsHostComponent {
  protected readonly ui = inject(UiStore);
  protected readonly modalData = () => resolveSurveyModalData(this.ui);
}
