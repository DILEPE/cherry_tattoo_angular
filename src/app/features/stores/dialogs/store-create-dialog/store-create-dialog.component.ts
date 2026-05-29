import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { StoresStore } from '../../stores.store';
import { StoresApiService } from '../../../../core/services/stores-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { StoreFormComponent } from '../../components/store-form/store-form.component';
import { StoreWritePayload } from '../../../../core/models/store.model';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-store-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoreFormComponent, AppButtonComponent],
  template: `
    <app-store-form (submitted)="save($event)">
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Crear</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-store-form>
  `,
})
export class StoreCreateDialogComponent {
  private readonly api = inject(StoresApiService);
  private readonly store = inject(StoresStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);

  save(body: StoreWritePayload): void {
    this.saving.set(true);
    this.api.create(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Tienda creada · ${body.name}`);
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
