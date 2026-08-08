import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component';
import { AppointmentsCalendarComponent } from '../appointments-calendar/appointments-calendar.component';
import { AppointmentsViewToolbarComponent } from '../appointments-view-toolbar/appointments-view-toolbar.component';
import { AppointmentsFiltersComponent } from '../appointments-filters/appointments-filters.component';
import { AppointmentsModalsHostComponent } from '../../dialogs/appointments-modals-host/appointments-modals-host.component';
import { ReportDailyDialogComponent } from '../report-daily-dialog/report-daily-dialog.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { UiStore } from '../../../../store/ui.store';
import { AppStore } from '../../../../store/app.store';
import { AppointmentModalData, BookAppointmentModalData } from '../../models/appointment-modal.model';
import { maySeeAllAppointments, isTechnicianRole } from '../../../../core/utils/panel-roles';
import {
  buildDailyWorkReport,
  DailyWorkReport,
  localDateIso,
} from '../../models/daily-work-report.util';

@Component({
  selector: 'app-appointments-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppointmentsViewToolbarComponent,
    AppointmentsFiltersComponent,
    AppButtonComponent,
    AppointmentsListComponent,
    AppointmentsCalendarComponent,
    AppointmentsModalsHostComponent,
    ReportDailyDialogComponent,
  ],
  template: `
    <div class="appt-shell-header">
      <app-appointments-view-toolbar />
      <div class="appt-shell-header__actions">
        @if (store.viewMode() === 'list') {
          <app-button variant="ghost" (clicked)="openDailyReport()">Reporte diario</app-button>
        }
        @if (canSearch()) {
          <app-button variant="ghost" (clicked)="openSearch()">Buscar cita</app-button>
        }
        @if (canBook()) {
          <app-button variant="primary" (clicked)="openBookToday()">Cita express</app-button>
        }
      </div>
    </div>
    <app-appointments-filters [calendarMode]="store.viewMode() === 'calendar'" />

    @if (store.viewMode() === 'calendar') {
      <app-appointments-calendar
        [showBookFooter]="canBook()"
        (selected)="openDetail($event)"
        (bookDay)="openBook($event)"
      />
    } @else {
      <app-appointments-list (selected)="openDetail($event)" />
    }

    <app-appointments-modals-host />

    <app-report-daily-dialog
      [open]="dailyOpen()"
      [report]="dailyReport()"
      (closed)="dailyOpen.set(false)"
    />
  `,
})
export class AppointmentsShellComponent {
  protected readonly store = inject(AppointmentsStore);
  private readonly ui = inject(UiStore);
  private readonly appStore = inject(AppStore);

  readonly dailyOpen = signal(false);
  readonly dailyReport = signal<DailyWorkReport>(
    buildDailyWorkReport([], {}, localDateIso()),
  );

  readonly canBook = computed(() => {
    const role = this.appStore.user()?.role ?? '';
    return role !== 'tatuador' && role !== 'perforador';
  });

  /** Tatuador/perforador no buscan citas (evita abrir historial pasado). */
  readonly canSearch = computed(() => {
    const role = this.appStore.user()?.role ?? '';
    return !isTechnicianRole(role);
  });

  private readonly _scopeEffect = effect(() => {
    const u = this.appStore.user();
    if (!u) return;
    if (!maySeeAllAppointments(u.role)) {
      untracked(() => this.store.setAssignedUserId(u.id));
    }
  });

  private readonly _loadEffect = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openDailyReport(): void {
    this.dailyReport.set(
      buildDailyWorkReport(
        this.store.items(),
        this.store.piercingTypeLabels(),
        localDateIso(),
      ),
    );
    this.dailyOpen.set(true);
  }

  openDetail(id: number): void {
    const data: AppointmentModalData = { appointmentId: id };
    if (this.store.viewMode() === 'calendar') {
      this.ui.openModal('appointment-focus', data);
    } else {
      this.ui.openModal('appointment-detail', data);
    }
  }

  openBook(date: Date): void {
    const data: BookAppointmentModalData = {
      pickedDate: this.toIsoDate(date),
    };
    this.ui.openModal('appointment-book', data);
  }

  openBookToday(): void {
    const data: BookAppointmentModalData = {
      pickedDate: this.toIsoDate(new Date()),
      express: true,
    };
    this.ui.openModal('appointment-book', data);
  }

  openSearch(): void {
    this.ui.openModal('appointment-search', {});
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
