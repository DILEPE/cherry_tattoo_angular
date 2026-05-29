import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomersStore } from '../../customers.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

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
      <app-button variant="primary" (clicked)="create.emit()">➕ Crear</app-button>
    </div>
  `,
})
export class CustomersToolbarComponent {
  protected readonly store = inject(CustomersStore);
  readonly create = output<void>();
}
