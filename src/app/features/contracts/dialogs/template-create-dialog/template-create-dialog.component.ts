import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContractsStore } from '../../contracts.store';
import { TemplatesApiService } from '../../services/templates-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import {
  TemplateFormComponent,
  TemplateFormValue,
} from '../../components/template-form/template-form.component';
import { templateToWritePayload } from '../../models/contract-template.mapper';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-template-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemplateFormComponent, AppButtonComponent],
  template: `
    <app-template-form (submitted)="save($event)">
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Crear versión</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-template-form>
  `,
})
export class TemplateCreateDialogComponent {
  private readonly api = inject(TemplatesApiService);
  private readonly store = inject(ContractsStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);

  save(value: TemplateFormValue): void {
    this.saving.set(true);
    this.api.create(templateToWritePayload(value)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Versión de contrato creada.');
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
