import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { TemplateCreateDialogComponent } from '../template-create-dialog/template-create-dialog.component';
import { TemplateEditDialogComponent } from '../template-edit-dialog/template-edit-dialog.component';
import { TemplateDeleteDialogComponent } from '../template-delete-dialog/template-delete-dialog.component';
import { ContractReadDialogComponent } from '../contract-read-dialog/contract-read-dialog.component';
import { resolveContractModalData } from '../contract-modal.util';

@Component({
  selector: 'app-contracts-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppModalComponent,
    TemplateCreateDialogComponent,
    TemplateEditDialogComponent,
    TemplateDeleteDialogComponent,
    ContractReadDialogComponent,
  ],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('template-create') {
        @defer (on immediate) {
          <app-modal
            title="Nueva versión de contrato"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-template-create-dialog />
          </app-modal>
        }
      }
      @case ('template-edit') {
        @defer (on immediate) {
          <app-modal
            [title]="'Editar: ' + (modalData().templateName || 'versión')"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-template-edit-dialog />
          </app-modal>
        }
      }
      @case ('template-delete') {
        @defer (on immediate) {
          <app-modal
            title="Eliminar versión"
            size="md"
            [isOpen]="true"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-template-delete-dialog />
          </app-modal>
        }
      }
      @case ('contract-read') {
        @defer (on immediate) {
          <app-modal
            title="Contrato firmado"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-contract-read-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class ContractsModalsHostComponent {
  protected readonly ui = inject(UiStore);
  protected readonly modalData = () => resolveContractModalData(this.ui);
}
