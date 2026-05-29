import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { StoresApiService } from '../../../../core/services/stores-api.service';
import { StoresStore } from '../../stores.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { StoreFormComponent } from '../../components/store-form/store-form.component';
import { Store, StoreWritePayload } from '../../../../core/models/store.model';
import { resolveStoreModalId } from '../store-modal.util';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-store-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoreFormComponent, AppButtonComponent, AppSkeletonComponent],
  template: `
    @if (loading()) {
      <app-skeleton [rows]="4" />
    } @else if (error()) {
      <p class="form-field__error">{{ error() }}</p>
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    } @else if (storeRow()) {
      <p class="st-dialog-hint">ID interno: <strong>#{{ storeRow()!.id }}</strong></p>
      <app-store-form [initial]="storeRow()" (submitted)="save($event)">
        <div actions class="appt-dialog-actions">
          <app-button type="submit" variant="primary" [loading]="saving()">Guardar</app-button>
          <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
        </div>
      </app-store-form>
    }
  `,
})
export class StoreEditDialogComponent {
  private readonly api = inject(StoresApiService);
  private readonly store = inject(StoresStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly storeRow = signal<Store | null>(null);

  private readonly _load = effect(() => {
    const id = resolveStoreModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'store-edit') return;
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (row) => {
        this.storeRow.set(row);
        this.loading.set(false);
        if (!row) this.error.set('Tienda no encontrada.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la tienda.');
        this.errors.handle(err);
      },
    });
  });

  save(body: StoreWritePayload): void {
    const id = resolveStoreModalId(this.ui);
    if (id <= 0) return;
    this.saving.set(true);
    this.api.update(id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Tienda actualizada · ${body.name}`);
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
