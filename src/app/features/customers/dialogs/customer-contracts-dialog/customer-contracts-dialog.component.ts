import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ContractsApiService } from '../../services/contracts-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { resolveCustomerModalId, resolveCustomerModalName } from '../customer-modal.util';
import { CustomerContractRow } from '../../models/customer.model';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-customer-contracts-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, AppSkeletonComponent],
  template: `
    <p class="appt-dialog-caption">
      <strong>{{ name() }}</strong> · ID {{ customerId() }}
    </p>
    @if (loading()) {
      <app-skeleton [rows]="4" />
    } @else if (error()) {
      <p class="form-field__error">{{ error() }}</p>
    } @else if (!rows().length) {
      <p class="empty-state">Este cliente no tiene contratos firmados.</p>
    } @else {
      <table class="cust-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cita</th>
            <th>Servicio</th>
            <th>Fecha cita</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.id) {
            <tr>
              <td>{{ r.id }}</td>
              <td>{{ r.appointmentId }}</td>
              <td>{{ r.serviceType }}</td>
              <td>{{ r.appointmentDate || '—' }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
    <div class="appt-dialog-actions">
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    </div>
  `,
})
export class CustomerContractsDialogComponent {
  private readonly api = inject(ContractsApiService);
  private readonly ui = inject(UiStore);
  private readonly errors = inject(ErrorService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<CustomerContractRow[]>([]);
  readonly name = signal(resolveCustomerModalName(this.ui));
  readonly customerId = signal(resolveCustomerModalId(this.ui));

  private readonly _load = effect(() => {
    const id = resolveCustomerModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'customer-contracts') return;
    this.customerId.set(id);
    this.loading.set(true);
    this.api.listByCustomer(id).subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los contratos.');
        this.errors.handle(err);
      },
    });
  });

  close(): void {
    this.ui.closeModal();
  }
}
