import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AppointmentsStore } from '../../appointments.store';
import { AppStore } from '../../../../store/app.store';
import { PanelStaffApiService } from '../../services/panel-staff-api.service';
import { StoresApiService } from '../../../../core/services/stores-api.service';
import { StoreOption } from '../../../../core/models/store.model';
import { PanelStaffOption } from '../../models/booking.model';
import { maySeeAllAppointments, PANEL_ROLE_LABEL_ES } from '../../../../core/utils/panel-roles';

@Component({
  selector: 'app-appointments-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="appt-filters" [class.appt-filters--calendar]="calendarMode()">
      <div class="appt-filters__fields">
        @if (!calendarMode()) {
          <label class="appt-filters__field appt-filters__field--search">
            <span class="appt-filters__label">Cliente</span>
            <input
              type="search"
              class="appt-filters__control"
              placeholder="Nombre cliente"
              [ngModel]="store.filters().nameSubstr"
              (ngModelChange)="store.setFilters({ nameSubstr: $event })"
            />
          </label>
        }
        <label class="appt-filters__field">
          <span class="appt-filters__label">Servicio</span>
          <select
            class="appt-filters__control appt-filters__select"
            [ngModel]="store.filters().service"
            (ngModelChange)="store.setFilters({ service: $event })"
          >
            @for (svc of store.serviceOptions(); track svc) {
              <option [value]="svc">{{ svc }}</option>
            }
          </select>
        </label>
        <label class="appt-filters__field">
          <span class="appt-filters__label">Estado</span>
          <select
            class="appt-filters__control appt-filters__select"
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
        <label class="appt-filters__field">
          <span class="appt-filters__label">Tienda</span>
          <select
            class="appt-filters__control appt-filters__select"
            [ngModel]="store.filters().storeId"
            (ngModelChange)="onStoreChange($event)"
          >
            @for (opt of storeOptions(); track opt.id) {
              <option [ngValue]="opt.id">{{ opt.label }}</option>
            }
          </select>
        </label>
        @if (canSeeAll()) {
          <label class="appt-filters__field appt-filters__field--staff">
            <span class="appt-filters__label">Profesional</span>
            <select
              class="appt-filters__control appt-filters__select"
              [ngModel]="selectedStaffKey()"
              (ngModelChange)="onStaffChange($event)"
            >
              @for (opt of staffOptions(); track opt.key) {
                <option [value]="opt.key">{{ opt.label }}</option>
              }
            </select>
          </label>
        }
      </div>
      <div class="appt-filters__actions">
        <button
          type="button"
          class="appt-filters__icon-btn"
          title="Limpiar filtros"
          aria-label="Limpiar filtros"
          (click)="onReset()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
            />
          </svg>
        </button>
        <button
          type="button"
          class="appt-filters__icon-btn"
          title="Actualizar citas"
          aria-label="Actualizar citas"
          (click)="store.invalidate()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 0 1-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
        </button>
      </div>
    </div>
    @if (!canSeeAll()) {
      <p class="appt-scope-caption">
        Solo ves citas asignadas a tu usuario del panel.
      </p>
    }
  `,
})
export class AppointmentsFiltersComponent {
  /** En calendario no se muestra el filtro por nombre (búsqueda vía «Buscar cita»). */
  readonly calendarMode = input(false);

  protected readonly store = inject(AppointmentsStore);
  private readonly appStore = inject(AppStore);
  private readonly staffApi = inject(PanelStaffApiService);
  private readonly storesApi = inject(StoresApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeOptions = signal<{ id: number; label: string }[]>([
    { id: 0, label: 'Todos' },
  ]);
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
      if (this.calendarMode() && this.store.filters().nameSubstr.trim()) {
        this.store.setFilters({ nameSubstr: '' });
      }
    });

    this.storesApi
      .listActive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list: StoreOption[]) => {
        this.storeOptions.set([
          { id: 0, label: 'Todos' },
          ...list.map((s) => ({ id: s.id, label: s.name })),
        ]);
      });

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

  onStoreChange(id: number): void {
    this.store.setFilters({ storeId: Number(id) || 0 });
  }

  onReset(): void {
    this.store.resetFilters();
    if (this.calendarMode()) {
      this.store.setFilters({ nameSubstr: '' });
    }
    if (this.canSeeAll()) {
      this.selectedStaffKey.set('0');
      this.store.setAssignedUserId(null);
    }
  }

  private staffLabel(s: PanelStaffOption): string {
    const tag = PANEL_ROLE_LABEL_ES[s.role] ?? s.role;
    return `${s.label} — ${tag}`;
  }
}
