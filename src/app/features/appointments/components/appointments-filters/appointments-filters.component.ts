import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AppointmentsStore } from '../../appointments.store';
import { AppStore } from '../../../../store/app.store';
import { PanelStaffApiService } from '../../services/panel-staff-api.service';
import { PanelStaffOption } from '../../models/booking.model';
import { maySeeAllAppointments, PANEL_ROLE_LABEL_ES } from '../../../../core/utils/panel-roles';

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
      @if (canSeeAll()) {
        <label>
          Profesional
          <select
            [ngModel]="selectedStaffKey()"
            (ngModelChange)="onStaffChange($event)"
          >
            @for (opt of staffOptions(); track opt.key) {
              <option [value]="opt.key">{{ opt.label }}</option>
            }
          </select>
        </label>
      }
      <button type="button" class="btn btn--ghost" (click)="store.resetFilters()">Limpiar</button>
      <button type="button" class="btn btn--ghost" (click)="store.invalidate()">Actualizar</button>
    </div>
    @if (!canSeeAll()) {
      <p class="appt-scope-caption">
        Solo ves citas asignadas a tu usuario del panel.
      </p>
    }
  `,
})
export class AppointmentsFiltersComponent {
  protected readonly store = inject(AppointmentsStore);
  private readonly appStore = inject(AppStore);
  private readonly staffApi = inject(PanelStaffApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly staffList = signal<PanelStaffOption[]>([]);
  readonly staffOptions = signal<{ key: string; label: string; id: number }[]>([
    { key: '0', label: 'Todos', id: 0 },
  ]);
  readonly selectedStaffKey = signal('0');

  readonly canSeeAll = () => {
    const role = this.appStore.user()?.role ?? '';
    return maySeeAllAppointments(role);
  };

  constructor() {
    effect(() => {
      if (!this.canSeeAll()) return;
      this.staffApi
        .listAssignable()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((list) => {
          this.staffList.set(list);
          const opts = [
            { key: '0', label: 'Todos', id: 0 },
            ...list.map((s) => ({
              key: String(s.id),
              label: this.staffLabel(s),
              id: s.id,
            })),
          ];
          this.staffOptions.set(opts);
          const cur = this.store.assignedUserId();
          const key = cur != null && cur > 0 ? String(cur) : '0';
          this.selectedStaffKey.set(key);
        });
    });
  }

  onStaffChange(key: string): void {
    this.selectedStaffKey.set(key);
    const id = Number(key);
    this.store.setAssignedUserId(!key || id <= 0 ? null : id);
  }

  private staffLabel(s: PanelStaffOption): string {
    const tag = PANEL_ROLE_LABEL_ES[s.role] ?? s.role;
    return `${s.label} — ${tag}`;
  }
}
