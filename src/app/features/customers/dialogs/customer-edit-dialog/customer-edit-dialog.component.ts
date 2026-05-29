import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CustomersApiService } from '../../services/customers-api.service';
import { CustomersStore } from '../../customers.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';
import { Customer, CustomerWritePayload } from '../../models/customer.model';
import { resolveCustomerModalId } from '../customer-modal.util';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-customer-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerFormComponent, AppButtonComponent, AppSkeletonComponent],
  template: `
    @if (loading()) {
      <app-skeleton [rows]="6" />
    } @else if (error()) {
      <p class="form-field__error">{{ error() }}</p>
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    } @else if (customer()) {
      <app-customer-form [initial]="customer()" (submitted)="save($event)">
        <div actions class="appt-dialog-actions">
          <app-button type="submit" variant="primary" [loading]="saving()">Guardar</app-button>
          <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
        </div>
      </app-customer-form>
    }
  `,
})
export class CustomerEditDialogComponent {
  private readonly api = inject(CustomersApiService);
  private readonly store = inject(CustomersStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly customer = signal<Customer | null>(null);

  private readonly _load = effect(() => {
    const id = resolveCustomerModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'customer-edit') return;
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (c) => {
        this.customer.set(c);
        this.loading.set(false);
        if (!c) this.error.set('Cliente no encontrado.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el cliente.');
        this.errors.handle(err);
      },
    });
  });

  save(body: CustomerWritePayload): void {
    const id = resolveCustomerModalId(this.ui);
    if (id <= 0) return;
    this.saving.set(true);
    this.api.update(id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cliente actualizado.');
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
