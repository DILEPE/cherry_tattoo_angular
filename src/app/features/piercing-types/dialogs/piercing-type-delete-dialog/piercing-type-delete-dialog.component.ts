import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PiercingTypesStore } from '../../piercing-types.store';
import { PiercingTypesApiService } from '../../services/piercing-types-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { PiercingTypeModalData } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-type-delete-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <p class="appt-dialog-warning">
      Se va a <strong>eliminar</strong> el tipo
      <strong>{{ label || 'seleccionado' }}</strong> y su PDF de cuidados. ¿Está seguro?
    </p>
    <p class="pt-delete-hint">
      También se quitará de las opciones de la encuesta de piercing. Las respuestas históricas no se
      borran.
    </p>
    <div class="appt-dialog-actions">
      <app-button variant="primary" [loading]="saving()" (clicked)="confirm()">Sí</app-button>
      <app-button variant="ghost" (clicked)="close()">No</app-button>
    </div>
  `,
})
export class PiercingTypeDeleteDialogComponent {
  private readonly api = inject(PiercingTypesApiService);
  private readonly store = inject(PiercingTypesStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);
  readonly label: string;

  constructor() {
    const data = (this.ui.activeModal()?.data ?? {}) as PiercingTypeModalData;
    this.label = String(data.label ?? '').trim();
  }

  confirm(): void {
    if (!this.label) return;
    this.saving.set(true);
    this.api.delete(this.label).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Tipo eliminado · ${this.label}`);
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
