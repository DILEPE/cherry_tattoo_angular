import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ReportStore } from '../../report.store';
import { ReportFinancesComponent } from '../report-finances/report-finances.component';
import { ReportSurveysComponent } from '../report-surveys/report-surveys.component';
import { AppointmentsModalsHostComponent } from '../../../appointments/dialogs/appointments-modals-host/appointments-modals-host.component';
import { AppointmentDialogStore } from '../../../appointments/appointment-dialog.store';
import { AppStore } from '../../../../store/app.store';
import { maySeeAllAppointments } from '../../../../core/utils/panel-roles';

@Component({
  selector: 'app-report-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReportStore, AppointmentDialogStore],
  imports: [
    ReportFinancesComponent,
    ReportSurveysComponent,
    AppointmentsModalsHostComponent,
  ],
  template: `
    <h2 class="page-title">Gestión reportes</h2>

    <div class="report-subsection-tabs" role="tablist">
      <label class="report-subsection-tab">
        <input
          type="radio"
          name="repSub"
          [checked]="store.subsection() === 'finances'"
          (change)="store.setSubsection('finances')"
        />
        Finanzas — citas
      </label>
      <label class="report-subsection-tab">
        <input
          type="radio"
          name="repSub"
          [checked]="store.subsection() === 'surveys'"
          (change)="store.setSubsection('surveys')"
        />
        Encuestas — satisfacción
      </label>
    </div>

    @if (store.subsection() === 'finances') {
      <app-report-finances />
    } @else {
      <app-report-surveys />
    }

    <app-appointments-modals-host />
  `,
})
export class ReportShellComponent {
  protected readonly store = inject(ReportStore);
  private readonly appStore = inject(AppStore);

  private readonly _scope = effect(() => {
    const u = this.appStore.user();
    if (!u) return;
    if (!maySeeAllAppointments(u.role)) {
      this.store.setAssignedUserId(u.id);
    }
  });

  private readonly _load = effect(() => {
    if (this.store.subsection() !== 'finances') return;
    this.store.reloadToken();
    this.store.load();
  });
}
