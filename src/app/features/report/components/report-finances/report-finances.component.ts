import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ReportStore } from '../../report.store';

import { formatCop } from '../../../appointments/models/appointment.mapper';

import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';

import { statusToPillVariant } from '../../../appointments/models/appointment.mapper';

import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';

import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';

import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

import { downloadReportFinancialExcel } from '../../models/report-financial-excel-export';
import { piercingAppointmentIdsForSurvey } from '../../models/work-performed-label.util';
import { AppointmentsApiService } from '../../../appointments/services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { firstValueFrom } from 'rxjs';



@Component({

  selector: 'app-report-finances',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [

    FormsModule,

    AppPillComponent,

    DateEsPipe,

    AppSkeletonComponent,

    AppButtonComponent,

  ],

  template: `

    <h3 class="report-section-title">Finanzas — citas</h3>



    <section class="report-search-panel" aria-labelledby="report-filters-title">

      <div class="report-search-panel__head">

        <h4 id="report-filters-title" class="report-search-panel__title">Filtros de búsqueda</h4>

        <div class="report-search-panel__actions">

          <app-button variant="ghost" (clicked)="store.resetFilters()">Limpiar filtros</app-button>

          <app-button

            variant="primary"

            [loading]="exporting()"

            [disabled]="!store.filteredItems().length"

            (clicked)="downloadExcel()"

          >

            Descargar Excel

          </app-button>

        </div>

      </div>



      <div class="report-search-panel__grid">

        <label class="report-search-panel__field report-search-panel__field--wide">

          <span class="report-search-panel__label">Nombre cliente</span>

          <input

            type="search"

            class="report-search-panel__input"

            placeholder="Buscar por nombre…"

            [ngModel]="store.filters().nameSubstr"

            (ngModelChange)="store.setFilters({ nameSubstr: $event })"

          />

        </label>

        <label class="report-search-panel__field">

          <span class="report-search-panel__label">Servicio</span>

          <select

            class="report-search-panel__select"

            [ngModel]="store.filters().service"

            (ngModelChange)="store.setFilters({ service: $event })"

          >

            @for (svc of store.serviceOptions(); track svc) {

              <option [value]="svc">{{ svc }}</option>

            }

          </select>

        </label>

        <label class="report-search-panel__field">

          <span class="report-search-panel__label">Estado</span>

          <select

            class="report-search-panel__select"

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

        <label class="report-search-panel__field">

          <span class="report-search-panel__label">Desde</span>

          <input

            type="date"

            class="report-search-panel__input"

            [ngModel]="store.filters().fromDate"

            (ngModelChange)="store.setFilters({ fromDate: $event })"

          />

        </label>

        <label class="report-search-panel__field">

          <span class="report-search-panel__label">Hasta</span>

          <input

            type="date"

            class="report-search-panel__input"

            [ngModel]="store.filters().toDate"

            (ngModelChange)="store.setFilters({ toDate: $event })"

          />

        </label>

      </div>

    </section>



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



      <div class="report-list-header">

        <h4 class="report-section-title">Listado de citas</h4>

        <p class="report-list-count">

          {{ store.filteredItems().length }} cita(s) con el filtro actual

        </p>

      </div>



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

  private readonly appointmentsApi = inject(AppointmentsApiService);

  private readonly toast = inject(ToastService);

  private readonly errors = inject(ErrorService);
  private readonly loading = inject(LoadingService);

  protected readonly formatCop = formatCop;

  protected readonly statusToPillVariant = statusToPillVariant;



  readonly exporting = signal(false);



  async downloadExcel(): Promise<void> {

    const rows = this.store.filteredItems();

    if (!rows.length) {

      this.toast.warn('No hay citas para exportar con el filtro actual.');

      return;

    }

    this.exporting.set(true);

    try {
      await this.loading.run('Exportando reporte financiero…', async () => {
        const piercingLabels = await firstValueFrom(
          this.appointmentsApi.getWorkPerformedLabels(piercingAppointmentIdsForSurvey(rows)),
        );
        try {
          await downloadReportFinancialExcel(rows, this.store.filters(), piercingLabels);
          const n = rows.length;
          this.toast.success(
            n === 1 ? 'Se exportó 1 cita a Excel.' : `Se exportaron ${n} citas a Excel.`,
          );
        } catch {
          this.toast.warn('No se pudo generar el archivo Excel.');
        }
      });
    } catch (err) {
      this.errors.handle(err);
    } finally {
      this.exporting.set(false);
    }

  }



}


