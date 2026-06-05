import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';
import { AppBadgeComponent } from '../../../../shared/ui/badge/app-badge.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import {
  serviceToBadgeVariant,
  statusToPillVariant,
} from '../../models/appointment.mapper';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppPillComponent,
    AppBadgeComponent,
    AppSkeletonComponent,
    DateEsPipe,
    TruncatePipe,
  ],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="8" />
    } @else if (store.error()) {
      <p class="empty-state">{{ store.error() }}</p>
    } @else if (!store.filteredItems().length) {
      <p class="empty-state">Sin citas para los filtros actuales.</p>
    } @else {
      <table class="appt-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Abono</th>
            <th>Pendiente</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of store.paginatedListItems(); track row.id) {
            <tr>
              <td>{{ row.appointmentDate | dateEs }}</td>
              <td>
                {{ row.customerName | truncate: 22 }}
                @if (row.isPriority) {
                  <app-pill variant="warning" label="Prioridad" />
                }
              </td>
              <td>
                <app-badge
                  [variant]="serviceToBadgeVariant(row.serviceType)"
                  [label]="row.serviceType"
                />
              </td>
              <td>
                <app-pill [variant]="statusToPillVariant(row.status)" [label]="row.statusLabel" />
              </td>
              <td>{{ row.financials.totalFmt }}</td>
              <td>{{ row.financials.depositFmt }}</td>
              <td>{{ row.financials.pendingFmt }}</td>
              <td>
                <button type="button" class="btn btn--ghost" (click)="selected.emit(row.id)">
                  Ver
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div class="appt-pagination">
        <button
          type="button"
          class="btn btn--ghost"
          [disabled]="store.listPage() <= 0"
          (click)="store.prevListPage()"
        >
          ◀
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          [disabled]="store.listPage() >= store.listTotalPages() - 1"
          (click)="store.nextListPage()"
        >
          ▶
        </button>
        <span class="appt-pagination-info">
          Página {{ store.listPage() + 1 }}/{{ store.listTotalPages() }} ·
          {{ store.filteredItems().length }} cita(s)
        </span>
      </div>
    }
  `,
})
export class AppointmentsListComponent {
  protected readonly store = inject(AppointmentsStore);
  readonly selected = output<number>();

  protected readonly statusToPillVariant = statusToPillVariant;
  protected readonly serviceToBadgeVariant = serviceToBadgeVariant;
}
