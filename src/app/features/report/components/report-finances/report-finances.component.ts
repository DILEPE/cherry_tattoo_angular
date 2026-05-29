import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportStore } from '../../report.store';
import { formatCop } from '../../../appointments/models/appointment.mapper';
import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';
import { statusToPillVariant } from '../../../appointments/models/appointment.mapper';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import {
  appointmentsToFinancialCsv,
  downloadCsv,
} from '../../models/report-financial-export';
import { UiStore } from '../../../../store/ui.store';
import { AppointmentModalData } from '../../../appointments/models/appointment-modal.model';

@Component({
  selector: 'app-report-finances',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppPillComponent, DateEsPipe, AppSkeletonComponent],
  template: `
    <h3 class="report-section-title">Finanzas — citas</h3>

    <div class="filters-bar report-filters">
      <label>
        <span class="sr-only">Nombre</span>
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
      <label>
        Desde
        <input
          type="date"
          [ngModel]="store.filters().fromDate"
          (ngModelChange)="store.setFilters({ fromDate: $event })"
        />
      </label>
      <label>
        Hasta
        <input
          type="date"
          [ngModel]="store.filters().toDate"
          (ngModelChange)="store.setFilters({ toDate: $event })"
        />
      </label>
      <button type="button" class="btn btn--ghost" (click)="store.resetFilters()">Limpiar</button>
    </div>

    @if (store.loading()) {
      <app-skeleton [rows]="6" />
    } @else if (store.error()) {
      <p class="empty-state">{{ store.error() }}</p>
    } @else {
      <div class="report-metrics">
        <div class="report-metric">
          <span class="report-metric-label">Total trabajo</span>
          <strong>{{ formatCop(store.totals().trabajo) }}</strong>
        </div>
        <div class="report-metric">
          <span class="report-metric-label">Total abonado</span>
          <strong>{{ formatCop(store.totals().abonado) }}</strong>
        </div>
        <div class="report-metric">
          <span class="report-metric-label">Saldo pendiente</span>
          <strong>{{ formatCop(store.totals().pendiente) }}</strong>
        </div>
      </div>

      <div class="report-export-row">
        <button
          type="button"
          class="btn btn--primary"
          [disabled]="!store.filteredItems().length"
          (click)="downloadExcel()"
        >
          Descargar CSV
        </button>
      </div>

      <h4 class="report-section-title">Listado de citas</h4>
      @if (!store.filteredItems().length) {
        <p class="empty-state">Sin citas para los filtros actuales.</p>
      } @else {
        <table class="appt-table report-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Artista</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Abonado</th>
              <th>Pendiente</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of store.pageRows(); track row.id) {
              <tr>
                <td>{{ row.customerName }}</td>
                <td>{{ row.assignedLabel }}</td>
                <td>{{ row.serviceType }}</td>
                <td>{{ row.appointmentDate | dateEs }}</td>
                <td>{{ row.financials.totalFmt }}</td>
                <td>{{ row.financials.depositFmt }}</td>
                <td>{{ row.financials.pendingFmt }}</td>
                <td>
                  <app-pill [variant]="statusToPillVariant(row.status)" [label]="row.statusLabel" />
                </td>
                <td>
                  <button type="button" class="btn btn--ghost" (click)="openRow(row.id)">
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
          <span class="appt-pagination-info">
            Página {{ store.page() + 1 }}/{{ store.totalPages() }} ·
            {{ store.filteredItems().length }} cita(s)
          </span>
        </div>
      }
    }
  `,
})
export class ReportFinancesComponent {
  protected readonly store = inject(ReportStore);
  private readonly ui = inject(UiStore);
  protected readonly formatCop = formatCop;
  protected readonly statusToPillVariant = statusToPillVariant;

  downloadExcel(): void {
    const csv = appointmentsToFinancialCsv(this.store.filteredItems());
    const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
    downloadCsv(`Informe-finanzas-citas-${stamp}.csv`, csv);
  }

  openRow(id: number): void {
    const data: AppointmentModalData = { appointmentId: id };
    this.ui.openModal('appointment-detail', data);
  }
}
