import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomersStore } from '../../customers.store';
import { CustomersApiService } from '../../services/customers-api.service';
import { downloadCustomersExcel } from '../../models/customers-excel-export';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-customers-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent],
  template: `
    <div class="cust-toolbar">
      <label class="cust-toolbar__search">
        <span class="sr-only">Buscar clientes</span>
        <input
          type="search"
          class="cust-toolbar__input"
          placeholder="Buscar por nombre, documento o correo…"
          [ngModel]="store.searchInput()"
          (ngModelChange)="store.setSearchInput($event)"
          (keydown.enter)="store.applySearch()"
        />
      </label>
      <app-button variant="ghost" (clicked)="store.applySearch()">Buscar</app-button>
      <app-button variant="ghost" (clicked)="store.refresh()">Actualizar</app-button>
      <app-button
        variant="ghost"
        [loading]="exporting()"
        [disabled]="store.total() <= 0"
        (clicked)="exportExcel()"
      >
        Descargar Excel
      </app-button>
      <app-button variant="primary" (clicked)="create.emit()">➕ Crear</app-button>
    </div>
  `,
})
export class CustomersToolbarComponent {
  protected readonly store = inject(CustomersStore);
  private readonly api = inject(CustomersApiService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly exporting = signal(false);
  readonly create = output<void>();

  exportExcel(): void {
    if (this.store.total() <= 0) {
      this.toast.warn('No hay clientes para exportar con el filtro actual.');
      return;
    }
    this.exporting.set(true);
    this.api.fetchAllForExport(this.store.searchQuery()).subscribe({
      next: async (rows) => {
        try {
          await downloadCustomersExcel(rows, this.store.searchQuery());
          this.toast.success(
            rows.length === 1
              ? 'Se exportó 1 cliente a Excel.'
              : `Se exportaron ${rows.length} clientes a Excel.`,
          );
        } catch {
          this.toast.warn('No se pudo generar el archivo Excel.');
        } finally {
          this.exporting.set(false);
        }
      },
      error: (err) => {
        this.exporting.set(false);
        this.errors.handle(err);
      },
    });
  }
}
