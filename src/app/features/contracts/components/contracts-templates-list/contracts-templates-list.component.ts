import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ContractsStore } from '../../contracts.store';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import {
  CONTRACT_KIND_LABEL_ES,
  ContractTemplate,
} from '../../models/contract-template.model';

@Component({
  selector: 'app-contracts-templates-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, AppIconActionButtonComponent],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="6" />
    } @else if (store.error()) {
      <p class="form-field__error">{{ store.error() }}</p>
    } @else if (!store.items().length) {
      <p class="empty-state">No hay versiones de contrato registradas.</p>
    } @else {
      <p class="ct-list-meta"><strong>Versiones registradas:</strong> {{ store.count() }}</p>
      <div class="ct-table-wrap">
        <table class="ct-table">
          <thead>
            <tr>
              <th><span class="ct-col-head">Nombre</span></th>
              <th><span class="ct-col-head">Tipo</span></th>
              <th><span class="ct-col-head">Versión</span></th>
              <th><span class="ct-col-head">Activa</span></th>
              <th><span class="ct-col-head ct-col-head--actions">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of store.items(); track row.id) {
              <tr>
                <td>{{ row.name }}</td>
                <td>{{ kindLabel(row.contractKind) }}</td>
                <td>{{ row.version }}</td>
                <td>
                  <span class="ct-active-pill" [class.ct-active-pill--on]="row.isActive">
                    {{ row.isActive ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td class="ct-row-actions">
                  <button
                    appIconAction="edit"
                    title="Editar versión"
                    (click)="edit.emit(row)"
                  ></button>
                  <button
                    appIconAction="trash"
                    title="Eliminar versión"
                    (click)="delete.emit(row)"
                  ></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ContractsTemplatesListComponent {
  protected readonly store = inject(ContractsStore);
  protected readonly kindLabel = (k: keyof typeof CONTRACT_KIND_LABEL_ES) =>
    CONTRACT_KIND_LABEL_ES[k];

  readonly edit = output<ContractTemplate>();
  readonly delete = output<ContractTemplate>();
}
