import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CustomersStore } from '../../customers.store';
import { CustomersApiService } from '../../services/customers-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';
import { CustomerWritePayload } from '../../models/customer.model';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-customer-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerFormComponent, AppButtonComponent],
  template: `
    <app-customer-form (submitted)="save($event)">
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Registrar</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-customer-form>
  `,
})
export class CustomerCreateDialogComponent {
  private readonly api = inject(CustomersApiService);
  private readonly store = inject(CustomersStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);

  save(body: CustomerWritePayload): void {
    this.saving.set(true);
    this.api.create(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cliente registrado.');
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
