import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { CalendarLegendComponent } from '../calendar-legend/calendar-legend.component';
import { CalendarMonthHeaderComponent } from '../calendar-month-header/calendar-month-header.component';
import { CalendarMonthGridComponent } from '../calendar-month-grid/calendar-month-grid.component';
import { CalendarPeriodToolbarComponent } from '../calendar-period-toolbar/calendar-period-toolbar.component';
import { CalendarGotoRowComponent } from '../calendar-goto-row/calendar-goto-row.component';
import { CalendarWeekHeaderComponent } from '../calendar-week-header/calendar-week-header.component';
import { CalendarWeekGridComponent } from '../calendar-week-grid/calendar-week-grid.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { CalendarDayOverflowModalData } from '../../models/appointment-modal.model';
import { buildWeekScheduleView } from '../../models/week-schedule.mapper';

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarLegendComponent,
    CalendarPeriodToolbarComponent,
    CalendarGotoRowComponent,
    CalendarMonthHeaderComponent,
    CalendarWeekHeaderComponent,
    CalendarMonthGridComponent,
    CalendarWeekGridComponent,
    AppSkeletonComponent,
  ],
  template: `
    <app-calendar-legend />
    <app-calendar-period-toolbar />
    <app-calendar-goto-row />

    @if (store.calendarPeriod() === 'month' || store.calendarPeriod() === 'team') {
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
    } @else if (store.calendarPeriod() === 'month' || store.calendarPeriod() === 'team') {
      <app-calendar-month-grid
        [showBookFooter]="showBookFooter()"
        (selected)="selected.emit($event)"
        (bookDay)="bookDay.emit($event)"
        (overflowDay)="openOverflow($event)"
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
  private readonly ui = inject(UiStore);
  readonly selected = output<number>();
  readonly bookDay = output<Date>();
  readonly showBookFooter = input(true);

  openOverflow(date: Date): void {
    const data: CalendarDayOverflowModalData = {
      pickedDate: this.toIsoDate(date),
    };
    this.ui.openModal('calendar-day-overflow', data);
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  readonly weekSpanLabel = computed(() => {
    const v = buildWeekScheduleView(
      this.store.weekMondayIso(),
      this.store.appointmentsByDay(),
      this.store.clientHistoryCounts(),
    );
    return v.spanLabel;
  });
}
