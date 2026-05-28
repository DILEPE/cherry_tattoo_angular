import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentsViewMode } from '../../models/calendar.model';

@Component({
  selector: 'app-appointments-view-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="appt-view-toolbar">
      <div class="appt-view-toolbar__tabs" role="tablist" aria-label="Vista de citas">
        <button
          type="button"
          class="appt-view-toolbar__tab"
          [class.appt-view-toolbar__tab--active]="store.viewMode() === 'calendar'"
          role="tab"
          [attr.aria-selected]="store.viewMode() === 'calendar'"
          (click)="setMode('calendar')"
        >
          Calendario
        </button>
        <button
          type="button"
          class="appt-view-toolbar__tab"
          [class.appt-view-toolbar__tab--active]="store.viewMode() === 'list'"
          role="tab"
          [attr.aria-selected]="store.viewMode() === 'list'"
          (click)="setMode('list')"
        >
          Lista
        </button>
      </div>
    </div>
  `,
})
export class AppointmentsViewToolbarComponent {
  protected readonly store = inject(AppointmentsStore);

  setMode(mode: AppointmentsViewMode): void {
    this.store.setViewMode(mode);
  }
}
