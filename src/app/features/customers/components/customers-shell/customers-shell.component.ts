import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { CustomersStore } from '../../customers.store';
import { CustomersToolbarComponent } from '../customers-toolbar/customers-toolbar.component';
import { CustomersListComponent } from '../customers-list/customers-list.component';
import { CustomersModalsHostComponent } from '../../dialogs/customers-modals-host/customers-modals-host.component';
import { UiStore } from '../../../../store/ui.store';
import { CustomerModalData } from '../../models/customer-modal.model';
import { Customer } from '../../models/customer.model';
import { customerDisplayName } from '../../models/customer.mapper';

@Component({
  selector: 'app-customers-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomersStore],
  imports: [CustomersToolbarComponent, CustomersListComponent, CustomersModalsHostComponent],
  template: `
    <h2 class="cust-page-title">Gestión de clientes</h2>
    <app-customers-toolbar (create)="openCreate()" />
    <app-customers-list
      (edit)="openEdit($event)"
      (delete)="openDelete($event)"
      (contracts)="openContracts($event)"
    />
    <app-customers-modals-host />
  `,
})
export class CustomersShellComponent {
  private readonly store = inject(CustomersStore);
  private readonly ui = inject(UiStore);

  private readonly _load = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openCreate(): void {
    this.ui.openModal('customer-create', {} satisfies CustomerModalData);
  }

  openEdit(row: Customer): void {
    this.ui.openModal('customer-edit', {
      customerId: row.id,
      customerName: customerDisplayName(row),
    } satisfies CustomerModalData);
  }

  openDelete(row: Customer): void {
    this.ui.openModal('customer-delete', {
      customerId: row.id,
      customerName: customerDisplayName(row),
    } satisfies CustomerModalData);
  }

  openContracts(row: Customer): void {
    this.ui.openModal('customer-contracts', {
      customerId: row.id,
      customerName: customerDisplayName(row),
    } satisfies CustomerModalData);
  }
}
