import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { StoresStore } from '../../stores.store';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import { Store } from '../../../../core/models/store.model';
import { storeContactLabel } from '../../../../core/models/store.mapper';

@Component({
  selector: 'app-stores-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, AppIconActionButtonComponent],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="6" />
    } @else if (store.error()) {
      <p class="form-field__error">{{ store.error() }}</p>
      @if (store.error()?.includes('500')) {
        <p class="st-list-hint">
          Si la API responde error interno, aplica la migración SQL <code>024_stores.sql</code> en
          MySQL y reinicia la API.
        </p>
      }
    } @else if (!store.items().length) {
      <p class="empty-state">No hay tiendas en el catálogo. Pulsa «Nueva tienda» para registrar una.</p>
    } @else {
      <p class="st-list-meta"><strong>{{ store.count() }}</strong> tienda(s) en catálogo</p>
      <div class="st-table-wrap">
        <table class="st-table">
          <thead>
            <tr>
              <th><span class="st-col-head">Nombre</span></th>
              <th><span class="st-col-head">Contacto</span></th>
              <th><span class="st-col-head">Dirección</span></th>
              <th><span class="st-col-head">Estado</span></th>
              <th><span class="st-col-head st-col-head--actions">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of store.items(); track row.id) {
              <tr [class.st-row--inactive]="!row.isActive">
                <td>{{ row.name }}</td>
                <td>{{ contactLabel(row) }}</td>
                <td>{{ row.address || '—' }}</td>
                <td>
                  <span class="st-active-pill" [class.st-active-pill--on]="row.isActive">
                    {{ row.isActive ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="st-row-actions">
                  <button appIconAction="edit" title="Editar tienda" (click)="edit.emit(row)"></button>
                  <button appIconAction="trash" title="Eliminar tienda" (click)="delete.emit(row)"></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class StoresListComponent {
  protected readonly store = inject(StoresStore);
  protected readonly contactLabel = storeContactLabel;

  readonly edit = output<Store>();
  readonly delete = output<Store>();
}
