import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { CalendarLegendComponent } from '../calendar-legend/calendar-legend.component';
import { CalendarMonthHeaderComponent } from '../calendar-month-header/calendar-month-header.component';
import { CalendarMonthGridComponent } from '../calendar-month-grid/calendar-month-grid.component';
import { CalendarPeriodToolbarComponent } from '../calendar-period-toolbar/calendar-period-toolbar.component';
import { CalendarWeekHeaderComponent } from '../calendar-week-header/calendar-week-header.component';
import { CalendarWeekGridComponent } from '../calendar-week-grid/calendar-week-grid.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { buildWeekScheduleView } from '../../models/week-schedule.mapper';

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarLegendComponent,
    CalendarPeriodToolbarComponent,
    CalendarMonthHeaderComponent,
    CalendarWeekHeaderComponent,
    CalendarMonthGridComponent,
    CalendarWeekGridComponent,
    AppSkeletonComponent,
  ],
  template: `
    <app-calendar-legend />
    <app-calendar-period-toolbar />

    @if (store.calendarPeriod() === 'month') {
      <app-calendar-month-header
        [year]="store.calendarMonth().year"
        [month]="store.calendarMonth().month"
        (prev)="store.prevCalendarMonth()"
        (next)="store.nextCalendarMonth()"
        (today)="store.goToTodayMonth()"
      />
    } @else {
      <app-calendar-week-header
        [spanLabel]="weekSpanLabel()"
        (prev)="store.prevWeek()"
        (next)="store.nextWeek()"
        (today)="store.goToTodayWeek()"
      />
    }

    @if (store.loading()) {
      <app-skeleton [rows]="10" />
    } @else if (store.error()) {
      <p class="empty-state">{{ store.error() }}</p>
    } @else if (store.calendarPeriod() === 'month') {
      <app-calendar-month-grid
        [showBookFooter]="showBookFooter()"
        (selected)="selected.emit($event)"
        (bookDay)="bookDay.emit($event)"
      />
    } @else {
      <app-calendar-week-grid
        [showBookFooter]="showBookFooter()"
        (selected)="selected.emit($event)"
        (bookDay)="bookDay.emit($event)"
      />
    }
  `,
})
export class AppointmentsCalendarComponent {
  protected readonly store = inject(AppointmentsStore);
  readonly selected = output<number>();
  readonly bookDay = output<Date>();
  readonly showBookFooter = input(true);

  readonly weekSpanLabel = computed(() => {
    const v = buildWeekScheduleView(
      this.store.weekMondayIso(),
      this.store.appointmentsByDay(),
      this.store.clientHistoryCounts(),
    );
    return v.spanLabel;
  });
}
