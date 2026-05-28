import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import {
  buildDayCellViews,
  buildMonthWeeks,
} from '../../models/calendar.mapper';
import { WEEKDAY_HEADERS_ES } from '../../models/calendar.model';
import { CalendarDayCellComponent } from '../calendar-day-cell/calendar-day-cell.component';

@Component({
  selector: 'app-calendar-month-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarDayCellComponent],
  template: `
    <div class="cal-month-grid">
      <div class="cal-month-weekdays">
        @for (wd of weekdays; track wd) {
          <div class="cal-m-whcell">{{ wd }}</div>
        }
      </div>
      @for (week of weeksView(); track $index) {
        <div class="cal-month-week">
          @for (cell of week; track $index) {
            <app-calendar-day-cell [cell]="cell" (selected)="selected.emit($event)" />
          }
        </div>
      }
    </div>
  `,
})
export class CalendarMonthGridComponent {
  private readonly store = inject(AppointmentsStore);
  readonly selected = output<number>();

  readonly weekdays = [...WEEKDAY_HEADERS_ES];

  readonly weeksView = computed(() => {
    const { year, month } = this.store.calendarMonth();
    const weeks = buildMonthWeeks(year, month);
    const today = new Date();
    return buildDayCellViews(
      weeks,
      this.store.appointmentsByDay(),
      this.store.clientHistoryCounts(),
      today,
    );
  });
}
