import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { SurveysStore } from '../../surveys.store';
import { SurveyQuestionsAdminApiService } from '../../services/survey-questions-admin-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import {
  resolveSurveyModalData,
  resolveSurveyQuestionModalId,
} from '../survey-modal.util';

@Component({
  selector: 'app-question-delete-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, AppSkeletonComponent],
  template: `
    <p>¿Eliminar esta pregunta?</p>
    <p class="sq-delete-label"><strong>«{{ label() }}»</strong></p>

    @if (impactLoading()) {
      <app-skeleton [rows]="2" />
    } @else if (registeredAnswers() > 0) {
      <p class="sq-delete-warn">
        Esta pregunta tiene <strong>{{ registeredAnswers() }}</strong> respuesta(s) de clientes
        guardadas. Al eliminarla esas estadísticas se perderán del reporte.
      </p>
    } @else {
      <p class="sq-delete-hint">Esta pregunta no tiene respuestas guardadas.</p>
    }

    <label class="sq-delete-confirm">
      <input type="checkbox" [checked]="confirmed()" (change)="onConfirm($event)" />
      Sí, quiero eliminarla definitivamente
    </label>

    <div class="appt-dialog-actions">
      <app-button
        variant="primary"
        [disabled]="!confirmed()"
        [loading]="saving()"
        (clicked)="confirm()"
      >
        Eliminar
      </app-button>
      <app-button variant="ghost" (clicked)="close()">Cancelar</app-button>
    </div>
  `,
})
export class QuestionDeleteDialogComponent {
  private readonly api = inject(SurveyQuestionsAdminApiService);
  private readonly store = inject(SurveysStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);
  readonly confirmed = signal(false);
  readonly impactLoading = signal(true);
  readonly registeredAnswers = signal(0);
  readonly label = signal(resolveSurveyModalData(this.ui).questionLabel ?? '—');

  private readonly _impact = effect(() => {
    const id = resolveSurveyQuestionModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'question-delete') return;
    this.impactLoading.set(true);
    this.confirmed.set(false);
    this.api.deletionImpact(id).subscribe({
      next: (impact) => {
        this.registeredAnswers.set(impact.registeredAnswers);
        this.label.set(impact.label || this.label());
        this.impactLoading.set(false);
      },
      error: (err) => {
        this.impactLoading.set(false);
        this.errors.handle(err);
      },
    });
  });

  onConfirm(ev: Event): void {
    this.confirmed.set((ev.target as HTMLInputElement).checked);
  }

  confirm(): void {
    const id = resolveSurveyQuestionModalId(this.ui);
    if (id <= 0 || !this.confirmed()) return;
    this.saving.set(true);
    this.api.delete(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Pregunta eliminada.');
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
