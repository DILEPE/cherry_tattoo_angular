import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContractsStore } from '../../contracts.store';
import { TemplatesApiService } from '../../services/templates-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { resolveContractModalData, resolveTemplateModalId } from '../contract-modal.util';

@Component({
  selector: 'app-template-delete-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <p>
      ¿Eliminar la versión <strong>{{ name() }}</strong> (ID {{ templateId() }})?
    </p>
    <p class="ct-delete-hint">
      Si hay contratos firmados con esta plantilla, la API no permitirá borrarla: desactívala en su
      lugar.
    </p>
    <div class="appt-dialog-actions">
      <app-button variant="primary" [loading]="saving()" (clicked)="confirm()">Eliminar</app-button>
      <app-button variant="ghost" (clicked)="close()">Cancelar</app-button>
    </div>
  `,
})
export class TemplateDeleteDialogComponent {
  private readonly api = inject(TemplatesApiService);
  private readonly store = inject(ContractsStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);
  readonly name = signal(resolveContractModalData(this.ui).templateName ?? '—');
  readonly templateId = signal(resolveTemplateModalId(this.ui));

  confirm(): void {
    const id = this.templateId();
    if (id <= 0) return;
    this.saving.set(true);
    this.api.delete(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Versión eliminada.');
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
