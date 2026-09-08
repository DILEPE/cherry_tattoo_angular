import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { CustomersStore } from '../../customers.store';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import {
  customerDisplayName,
  customerDocumentLabel,
} from '../../models/customer.mapper';
import { Customer } from '../../models/customer.model';
import { AppStore } from '../../../../store/app.store';
import { maySeeCustomerContact } from '../../../../core/utils/panel-roles';

function formatCreatedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const s = String(iso).trim().replace('T', ' ');
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s);
  if (!m) return s.slice(0, 16);
  const date = `${m[3]}/${m[2]}/${m[1]}`;
  if (m[4] != null && m[5] != null) return `${date} ${m[4]}:${m[5]}`;
  return date;
}

@Component({
  selector: 'app-customers-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, AppIconActionButtonComponent],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="8" />
    } @else if (store.error()) {
      <p class="empty-state">{{ store.error() }}</p>
    } @else if (!store.items().length) {
      <p class="empty-state">No hay clientes para mostrar.</p>
    } @else {
      <div class="cust-table-wrap">
        <table class="cust-table">
          <thead>
            <tr>
              <th><span class="cust-col-head">Nombre</span></th>
              <th><span class="cust-col-head">Documento</span></th>
              @if (canSeeContact()) {
                <th><span class="cust-col-head">Correo</span></th>
                <th><span class="cust-col-head">Teléfono</span></th>
              }
              <th><span class="cust-col-head">Fecha de creación</span></th>
              <th><span class="cust-col-head cust-col-head--actions">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of store.items(); track row.id) {
              <tr>
                <td>{{ displayName(row) }}</td>
                <td>{{ documentLabel(row) }}</td>
                @if (canSeeContact()) {
                  <td>{{ row.email }}</td>
                  <td>{{ row.phoneNumber }}</td>
                }
                <td>{{ createdAtLabel(row) }}</td>
                <td class="cust-row-actions">
                  <button
                    appIconAction="edit"
                    title="Editar"
                    (click)="edit.emit(row)"
                  ></button>
                  <button
                    appIconAction="trash"
                    title="Eliminar"
                    (click)="delete.emit(row)"
                  ></button>
                  <button
                    appIconAction="document"
                    title="Contratos"
                    (click)="contracts.emit(row)"
                  ></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="cust-pagination">
        <button
          type="button"
          class="btn btn--ghost"
          [disabled]="store.page() <= 0"
          (click)="store.prevPage()"
        >
          ◀
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          [disabled]="store.page() >= store.totalPages() - 1"
          (click)="store.nextPage()"
        >
          ▶
        </button>
        <label class="cust-page-size">
          Por página
          <select
            [value]="store.pageSize()"
            (change)="onPageSize($event)"
          >
            @for (n of pageSizes; track n) {
              <option [value]="n">{{ n }}</option>
            }
          </select>
        </label>
        <span class="cust-pagination-info">
          Página {{ store.page() + 1 }}/{{ store.totalPages() }} ·
          {{ store.total() }} cliente(s)
        </span>
      </div>
    }
  `,
})
export class CustomersListComponent {
  protected readonly store = inject(CustomersStore);
  private readonly appStore = inject(AppStore);
  protected readonly displayName = customerDisplayName;
  protected readonly documentLabel = customerDocumentLabel;
  protected readonly createdAtLabel = (row: Customer) => formatCreatedAt(row.createdAt);
  readonly pageSizes = [10, 20, 50, 100];

  readonly canSeeContact = computed(() =>
    maySeeCustomerContact(this.appStore.user()?.role ?? ''),
  );

  readonly edit = output<Customer>();
  readonly delete = output<Customer>();
  readonly contracts = output<Customer>();

  onPageSize(ev: Event): void {
    const v = Number((ev.target as HTMLSelectElement).value);
    this.store.setPageSize(v);
  }
}
