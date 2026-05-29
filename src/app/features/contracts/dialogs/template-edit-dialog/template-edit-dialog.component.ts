import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ContractsStore } from '../../contracts.store';
import { TemplatesApiService } from '../../services/templates-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import {
  TemplateFormComponent,
  TemplateFormValue,
} from '../../components/template-form/template-form.component';
import { templateToWritePayload } from '../../models/contract-template.mapper';
import { ContractTemplate } from '../../models/contract-template.model';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { resolveTemplateModalId } from '../contract-modal.util';

@Component({
  selector: 'app-template-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemplateFormComponent, AppButtonComponent, AppSkeletonComponent],
  template: `
    @if (loading()) {
      <app-skeleton [rows]="8" />
    } @else if (loadError()) {
      <p class="form-field__error">{{ loadError() }}</p>
      <div class="appt-dialog-actions">
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      </div>
    } @else if (template()) {
      <app-template-form [initial]="template()!" (submitted)="save($event)">
        <div actions class="appt-dialog-actions">
          <app-button type="submit" variant="primary" [loading]="saving()">Guardar cambios</app-button>
          <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
        </div>
      </app-template-form>
    }
  `,
})
export class TemplateEditDialogComponent {
  private readonly api = inject(TemplatesApiService);
  private readonly store = inject(ContractsStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly template = signal<ContractTemplate | null>(null);
  readonly saving = signal(false);

  private readonly _load = effect(() => {
    const id = resolveTemplateModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'template-edit') return;
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (t) => {
        this.template.set(t);
        this.loadError.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set('No se pudo cargar la plantilla.');
        this.errors.handle(err);
      },
    });
  });

  save(value: TemplateFormValue): void {
    const id = resolveTemplateModalId(this.ui);
    if (id <= 0) return;
    this.saving.set(true);
    this.api.update(id, templateToWritePayload(value)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Versión actualizada.');
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
