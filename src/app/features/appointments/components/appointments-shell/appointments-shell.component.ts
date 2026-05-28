import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component';
import { AppointmentsCalendarComponent } from '../appointments-calendar/appointments-calendar.component';
import { AppointmentsViewToolbarComponent } from '../appointments-view-toolbar/appointments-view-toolbar.component';
import { AppointmentsFiltersComponent } from '../appointments-filters/appointments-filters.component';
import { AppointmentsModalsHostComponent } from '../../dialogs/appointments-modals-host/appointments-modals-host.component';
import { UiStore } from '../../../../store/ui.store';
import { AppointmentModalData } from '../../models/appointment-modal.model';

@Component({
  selector: 'app-appointments-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AppointmentsStore, AppointmentDialogStore],
  imports: [
    AppointmentsViewToolbarComponent,
    AppointmentsFiltersComponent,
    AppointmentsListComponent,
    AppointmentsCalendarComponent,
    AppointmentsModalsHostComponent,
  ],
  template: `
    <app-appointments-view-toolbar />
    <app-appointments-filters />

    @if (store.viewMode() === 'calendar') {
      <app-appointments-calendar (selected)="openDetail($event)" />
    } @else {
      <app-appointments-list (selected)="openDetail($event)" />
    }

    <app-appointments-modals-host />
  `,
})
export class AppointmentsShellComponent {
  protected readonly store = inject(AppointmentsStore);
  private readonly ui = inject(UiStore);

  private readonly _loadEffect = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openDetail(id: number): void {
    const data: AppointmentModalData = { appointmentId: id };
    this.ui.openModal('appointment-detail', data);
  }
}
