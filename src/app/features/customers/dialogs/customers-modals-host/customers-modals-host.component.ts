import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { CustomerCreateDialogComponent } from '../customer-create-dialog/customer-create-dialog.component';
import { CustomerEditDialogComponent } from '../customer-edit-dialog/customer-edit-dialog.component';
import { CustomerDeleteDialogComponent } from '../customer-delete-dialog/customer-delete-dialog.component';
import { CustomerContractsDialogComponent } from '../customer-contracts-dialog/customer-contracts-dialog.component';

@Component({
  selector: 'app-customers-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppModalComponent,
    CustomerCreateDialogComponent,
    CustomerEditDialogComponent,
    CustomerDeleteDialogComponent,
    CustomerContractsDialogComponent,
  ],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('customer-create') {
        @defer (on immediate) {
          <app-modal
            title="Registrar cliente"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-customer-create-dialog />
          </app-modal>
        }
      }
      @case ('customer-edit') {
        @defer (on immediate) {
          <app-modal
            title="Editar cliente"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-customer-edit-dialog />
          </app-modal>
        }
      }
      @case ('customer-delete') {
        @defer (on immediate) {
          <app-modal
            title="Eliminar cliente"
            size="md"
            [isOpen]="true"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-customer-delete-dialog />
          </app-modal>
        }
      }
      @case ('customer-contracts') {
        @defer (on immediate) {
          <app-modal
            title="Contratos firmados"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-customer-contracts-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class CustomersModalsHostComponent {
  protected readonly ui = inject(UiStore);
}
