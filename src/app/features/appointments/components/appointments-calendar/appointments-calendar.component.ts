import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { CalendarLegendComponent } from '../calendar-legend/calendar-legend.component';
import { CalendarMonthHeaderComponent } from '../calendar-month-header/calendar-month-header.component';
import { CalendarMonthGridComponent } from '../calendar-month-grid/calendar-month-grid.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarLegendComponent,
    CalendarMonthHeaderComponent,
    CalendarMonthGridComponent,
    AppSkeletonComponent,
  ],
  template: `
    <app-calendar-legend />

    <app-calendar-month-header
      [year]="store.calendarMonth().year"
      [month]="store.calendarMonth().month"
      (prev)="store.prevCalendarMonth()"
      (next)="store.nextCalendarMonth()"
      (today)="store.goToTodayMonth()"
    />

    @if (store.loading()) {
      <app-skeleton [rows]="10" />
    } @else if (store.error()) {
      <p class="empty-state">{{ store.error() }}</p>
    } @else {
      <app-calendar-month-grid (selected)="selected.emit($event)" />
    }
  `,
})
export class AppointmentsCalendarComponent {
  protected readonly store = inject(AppointmentsStore);
  readonly selected = output<number>();
}
