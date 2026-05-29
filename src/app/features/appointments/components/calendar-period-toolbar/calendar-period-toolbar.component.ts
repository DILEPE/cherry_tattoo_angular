import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { CalendarPeriod } from '../../models/calendar.model';

@Component({
  selector: 'app-calendar-period-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal-period-toolbar" role="tablist" aria-label="Periodo del calendario">
      <button
        type="button"
        class="cal-period-toolbar__tab"
        [class.cal-period-toolbar__tab--active]="store.calendarPeriod() === 'month'"
        (click)="setPeriod('month')"
      >
        Mes compacto
      </button>
      <button
        type="button"
        class="cal-period-toolbar__tab"
        [class.cal-period-toolbar__tab--active]="store.calendarPeriod() === 'week'"
        (click)="setPeriod('week')"
      >
        Semana
      </button>
    </div>
  `,
})
export class CalendarPeriodToolbarComponent {
  protected readonly store = inject(AppointmentsStore);

  setPeriod(period: CalendarPeriod): void {
    this.store.setCalendarPeriod(period);
  }
}
