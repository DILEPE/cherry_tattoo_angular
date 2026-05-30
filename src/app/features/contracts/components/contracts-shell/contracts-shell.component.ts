import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ContractsStore } from '../../contracts.store';
import { ContractsToolbarComponent } from '../contracts-toolbar/contracts-toolbar.component';
import { ContractsTemplatesListComponent } from '../contracts-templates-list/contracts-templates-list.component';
import { ContractsModalsHostComponent } from '../../dialogs/contracts-modals-host/contracts-modals-host.component';
import { UiStore } from '../../../../store/ui.store';
import { ContractModalData } from '../../models/contract-modal.model';
import { ContractTemplate } from '../../models/contract-template.model';

@Component({
  selector: 'app-contracts-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ContractsStore],
  imports: [
    ContractsToolbarComponent,
    ContractsTemplatesListComponent,
    ContractsModalsHostComponent,
  ],
  template: `
    <h2 class="ct-page-title">Gestión de contratos</h2>
    <p class="ct-page-lead">
      Administra las plantillas de contrato para tatuaje y piercing. Solo puede haber una plantilla
      activa por tipo de trabajo. El flujo al firmar (con o sin fases) se define en cada plantilla.
    </p>
    <app-contracts-toolbar (create)="openCreate()" />
    <app-contracts-templates-list (edit)="openEdit($event)" (delete)="openDelete($event)" />
    <app-contracts-modals-host />
  `,
})
export class ContractsShellComponent {
  private readonly store = inject(ContractsStore);
  private readonly ui = inject(UiStore);

  private readonly _load = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openCreate(): void {
    this.ui.openModal('template-create', {} satisfies ContractModalData);
  }

  openEdit(row: ContractTemplate): void {
    this.ui.openModal('template-edit', {
      templateId: row.id,
      templateName: row.name,
    } satisfies ContractModalData);
  }

  openDelete(row: ContractTemplate): void {
    this.ui.openModal('template-delete', {
      templateId: row.id,
      templateName: row.name,
    } satisfies ContractModalData);
  }
}
