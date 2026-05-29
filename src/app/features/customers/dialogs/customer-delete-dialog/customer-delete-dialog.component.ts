import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CustomersApiService } from '../../services/customers-api.service';
import { CustomersStore } from '../../customers.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { resolveCustomerModalId, resolveCustomerModalName } from '../customer-modal.util';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-customer-delete-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <p class="appt-dialog-warning">
      Se va a <strong>eliminar</strong> al cliente
      <strong>{{ name() || 'seleccionado' }}</strong>. ¿Está seguro?
    </p>
    <div class="appt-dialog-actions">
      <app-button variant="primary" [loading]="saving()" (clicked)="confirm()">Sí</app-button>
      <app-button variant="ghost" (clicked)="close()">No</app-button>
    </div>
  `,
})
export class CustomerDeleteDialogComponent {
  private readonly api = inject(CustomersApiService);
  private readonly store = inject(CustomersStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);
  readonly name = signal(resolveCustomerModalName(this.ui));

  confirm(): void {
    const id = resolveCustomerModalId(this.ui);
    if (id <= 0) return;
    this.saving.set(true);
    this.api.delete(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cliente eliminado.');
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
