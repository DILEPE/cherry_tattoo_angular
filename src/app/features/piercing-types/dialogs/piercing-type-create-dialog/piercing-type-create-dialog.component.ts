import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { PiercingTypesStore } from '../../piercing-types.store';
import { PiercingTypesApiService } from '../../services/piercing-types-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { PiercingTypeFormComponent } from '../../components/piercing-type-form/piercing-type-form.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { PiercingTypeWritePayload } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-type-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PiercingTypeFormComponent, AppButtonComponent],
  template: `
    <app-piercing-type-form [requirePdf]="true" (submitted)="save($event)">
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Crear</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-piercing-type-form>
  `,
})
export class PiercingTypeCreateDialogComponent implements OnInit {
  private readonly api = inject(PiercingTypesApiService);
  private readonly store = inject(PiercingTypesStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly formRef = viewChild(PiercingTypeFormComponent);

  readonly saving = signal(false);

  ngOnInit(): void {
    queueMicrotask(() => this.formRef()?.hydrate());
  }

  save(body: PiercingTypeWritePayload & { pdfOptional: boolean }): void {
    if (!body.pdf_base64) {
      this.toast.warn('Selecciona el PDF de cuidados.');
      return;
    }
    this.saving.set(true);
    this.api
      .create({
        survey_option_label: body.survey_option_label,
        source_filename: body.source_filename,
        pdf_base64: body.pdf_base64,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(`Tipo creado · ${body.survey_option_label}`);
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
