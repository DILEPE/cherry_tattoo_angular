import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component';
import { AppointmentsCalendarComponent } from '../appointments-calendar/appointments-calendar.component';
import { AppointmentsViewToolbarComponent } from '../appointments-view-toolbar/appointments-view-toolbar.component';
import { AppointmentsFiltersComponent } from '../appointments-filters/appointments-filters.component';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';

@Component({
  selector: 'app-appointments-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AppointmentsStore],
  imports: [
    AppointmentsViewToolbarComponent,
    AppointmentsFiltersComponent,
    AppointmentsListComponent,
    AppointmentsCalendarComponent,
    AppModalComponent,
  ],
  template: `
    <app-appointments-view-toolbar />
    <app-appointments-filters />

    @if (store.viewMode() === 'calendar') {
      <app-appointments-calendar (selected)="openDetail($event)" />
    } @else {
      <app-appointments-list (selected)="openDetail($event)" />
    }

    @switch (ui.activeModal()?.id) {
      @case ('appointment-detail') {
        @defer (on immediate) {
          <app-modal title="Detalle de cita" size="md" [isOpen]="true">
            <p>Reprogramar, finanzas y recibos: próxima iteración.</p>
            <p>ID cita: {{ ui.activeModal()?.data }}</p>
          </app-modal>
        } @loading {
          <p>Cargando…</p>
        }
      }
    }
  `,
})
export class AppointmentsShellComponent {
  protected readonly store = inject(AppointmentsStore);
  protected readonly ui = inject(UiStore);

  private readonly _loadEffect = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });

  openDetail(id: number): void {
    this.ui.openModal('appointment-detail', id);
  }
}
