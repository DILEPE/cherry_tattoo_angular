import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentsStore } from '../../appointments.store';

@Component({
  selector: 'app-appointments-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="filters-bar">
      <label>
        <span class="sr-only">Buscar cliente</span>
        <input
          type="search"
          placeholder="Nombre cliente"
          [ngModel]="store.filters().nameSubstr"
          (ngModelChange)="store.setFilters({ nameSubstr: $event })"
        />
      </label>
      <label>
        Servicio
        <select
          [ngModel]="store.filters().service"
          (ngModelChange)="store.setFilters({ service: $event })"
        >
          @for (svc of store.serviceOptions(); track svc) {
            <option [value]="svc">{{ svc }}</option>
          }
        </select>
      </label>
      <label>
        Estado
        <select
          [ngModel]="store.filters().status"
          (ngModelChange)="store.setFilters({ status: $event })"
        >
          <option value="Todos">Todos</option>
          <option value="Agendada">Agendada</option>
          <option value="Reprogramada">Reprogramada</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Finalizada">Finalizada</option>
        </select>
      </label>
      <button type="button" class="btn btn--ghost" (click)="store.resetFilters()">Limpiar</button>
      <button type="button" class="btn btn--ghost" (click)="store.invalidate()">Actualizar</button>
    </div>
  `,
})
export class AppointmentsFiltersComponent {
  protected readonly store = inject(AppointmentsStore);
}
