import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component';
import { AppointmentsCalendarComponent } from '../appointments-calendar/appointments-calendar.component';
import { AppointmentsViewToolbarComponent } from '../appointments-view-toolbar/appointments-view-toolbar.component';
import { AppointmentsFiltersComponent } from '../appointments-filters/appointments-filters.component';
import { AppointmentsModalsHostComponent } from '../../dialogs/appointments-modals-host/appointments-modals-host.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { UiStore } from '../../../../store/ui.store';
import { AppStore } from '../../../../store/app.store';
import { AppointmentModalData, BookAppointmentModalData } from '../../models/appointment-modal.model';

@Component({
  selector: 'app-appointments-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AppointmentsStore, AppointmentDialogStore],
  imports: [
    AppointmentsViewToolbarComponent,
    AppointmentsFiltersComponent,
    AppButtonComponent,
    AppointmentsListComponent,
    AppointmentsCalendarComponent,
    AppointmentsModalsHostComponent,
  ],
  template: `
    <div class="appt-shell-header">
      <app-appointments-view-toolbar />
      @if (canBook()) {
        <app-button variant="primary" (clicked)="openBookToday()">Cita express</app-button>
      }
    </div>
    <app-appointments-filters />

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
  `,
})
export class AppointmentsShellComponent {
  protected readonly store = inject(AppointmentsStore);
  private readonly ui = inject(UiStore);
  private readonly appStore = inject(AppStore);

  readonly canBook = computed(() => {
    const role = this.appStore.user()?.role ?? '';
    return role !== 'tatuador' && role !== 'perforador';
  });

  private readonly _loadEffect = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openDetail(id: number): void {
    const data: AppointmentModalData = { appointmentId: id };
    this.ui.openModal('appointment-detail', data);
  }

  openBook(date: Date): void {
    const data: BookAppointmentModalData = {
      pickedDate: this.toIsoDate(date),
    };
    this.ui.openModal('appointment-book', data);
  }

  openBookToday(): void {
    this.openBook(new Date());
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
