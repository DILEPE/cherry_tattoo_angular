import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppStore } from '../../../../store/app.store';
import { CalendarPeriod } from '../../models/calendar.model';
import { maySeeAllAppointments } from '../../../../core/utils/panel-roles';

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
      @if (canTeam()) {
        <button
          type="button"
          class="cal-period-toolbar__tab"
          [class.cal-period-toolbar__tab--active]="store.calendarPeriod() === 'team'"
          (click)="setPeriod('team')"
        >
          Mes por equipo
        </button>
      }
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
  private readonly appStore = inject(AppStore);

  readonly canTeam = computed(() => {
    const role = this.appStore.user()?.role ?? '';
    if (!maySeeAllAppointments(role)) return false;
    const aid = this.store.assignedUserId();
    return aid == null || aid <= 0;
  });

  setPeriod(period: CalendarPeriod): void {
    this.store.setCalendarPeriod(period);
  }
}
