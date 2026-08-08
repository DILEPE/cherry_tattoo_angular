import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { PiercingTypesStore } from '../../piercing-types.store';
import { PiercingTypesApiService } from '../../services/piercing-types-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { PiercingTypeFormComponent } from '../../components/piercing-type-form/piercing-type-form.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { PiercingTypeModalData, PiercingTypeUpdatePayload, PiercingTypeWritePayload } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-type-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PiercingTypeFormComponent, AppButtonComponent],
  template: `
    <app-piercing-type-form
      [requirePdf]="false"
      [initialLabel]="label"
      [initialFilename]="filename"
      (submitted)="save($event)"
    >
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Guardar</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-piercing-type-form>
  `,
})
export class PiercingTypeEditDialogComponent implements OnInit {
  private readonly api = inject(PiercingTypesApiService);
  private readonly store = inject(PiercingTypesStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly formRef = viewChild(PiercingTypeFormComponent);

  readonly saving = signal(false);
  readonly label: string;
  readonly filename: string;

  constructor() {
    const data = (this.ui.activeModal()?.data ?? {}) as PiercingTypeModalData;
    this.label = String(data.label ?? '').trim();
    this.filename = String(data.sourceFilename ?? '').trim();
  }

  ngOnInit(): void {
    queueMicrotask(() => this.formRef()?.hydrate());
  }

  save(body: PiercingTypeWritePayload & { pdfOptional: boolean }): void {
    if (!this.label) return;
    const patch: PiercingTypeUpdatePayload = {};
    if (body.survey_option_label && body.survey_option_label !== this.label) {
      patch.survey_option_label = body.survey_option_label;
    }
    if (body.source_filename) {
      patch.source_filename = body.source_filename;
    }
    if (body.pdf_base64) {
      patch.pdf_base64 = body.pdf_base64;
    }
    if (!Object.keys(patch).length) {
      this.toast.warn('No hay cambios para guardar.');
      return;
    }
    this.saving.set(true);
    this.api.update(this.label, patch).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Tipo de piercing actualizado.');
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
