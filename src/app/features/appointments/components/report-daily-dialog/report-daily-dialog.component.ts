import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { DailyWorkReport } from '../../models/daily-work-report.util';

@Component({
  selector: 'app-report-daily-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppModalComponent, AppButtonComponent, DateEsPipe],
  template: `
    <app-modal
      title="Reporte diario de trabajo"
      size="md"
      [isOpen]="open()"
      (closed)="closed.emit()"
    >
      <p class="report-daily__intro">
        Citas <strong>finalizadas</strong> del
        <strong>{{ reportDate() | dateEs }}</strong>.
      </p>

      <div class="report-daily__total" aria-live="polite">
        <span class="report-daily__total-label">Total trabajos</span>
        <strong class="report-daily__total-value">{{ report().total }}</strong>
      </div>

      @if (report().total === 0) {
        <p class="empty-state report-daily__empty">
          No hay citas finalizadas para hoy.
        </p>
      } @else {
        <section class="report-daily__section" aria-labelledby="daily-kind-title">
          <h3 id="daily-kind-title" class="report-daily__section-title">Por tipo de trabajo</h3>
          <ul class="report-daily__list">
            @for (row of report().byWorkKind; track row.key) {
              <li class="report-daily__row">
                <span>{{ row.label }}</span>
                <strong>{{ row.count }}</strong>
              </li>
            }
          </ul>
        </section>

        @if (report().byPiercingPlacement.length) {
          <section class="report-daily__section" aria-labelledby="daily-place-title">
            <h3 id="daily-place-title" class="report-daily__section-title">
              Colocaciones por tipo de piercing
            </h3>
            <ul class="report-daily__list">
              @for (row of report().byPiercingPlacement; track row.key) {
                <li class="report-daily__row">
                  <span>{{ row.label }}</span>
                  <strong>{{ row.count }}</strong>
                </li>
              }
            </ul>
          </section>
        }
      }

      <div class="appt-dialog-actions report-daily__actions">
        <app-button variant="ghost" (clicked)="closed.emit()">Cerrar</app-button>
      </div>
    </app-modal>
  `,
})
export class ReportDailyDialogComponent {
  readonly open = input(false);
  readonly report = input.required<DailyWorkReport>();
  readonly closed = output<void>();

  protected readonly reportDate = computed(() => {
    const iso = this.report().dateIso;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  });
}
