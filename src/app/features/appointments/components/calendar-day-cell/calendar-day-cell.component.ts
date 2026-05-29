import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarDayCellView } from '../../models/calendar.model';
import { CalendarAppointmentSlotComponent } from '../calendar-appointment-slot/calendar-appointment-slot.component';

@Component({
  selector: 'app-calendar-day-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarAppointmentSlotComponent],
  template: `
    @if (!cell().inMonth) {
      <div class="cal-cell-spacer--month" aria-hidden="true"></div>
    } @else {
      <div
        class="cal-cell cal-cell--month"
        [class.cal-cell-today]="cell().isToday"
      >
        <div class="cal-cell-head">
          <span class="cal-cell-daynum">{{ cell().day }}</span>
        </div>
        <div class="cal-day-inner">
          @if (!cell().slots.length) {
            <div class="cal-day-empty">—</div>
          } @else {
            @for (slot of cell().slots; track slot.id) {
              <app-calendar-appointment-slot
                [slot]="slot"
                (selected)="selected.emit($event)"
              />
            }
          }
        </div>
        @if (showBookFooter()) {
          <div class="cal-cell-footer-strip">
            <span class="cal-footer-daynum">{{ cell().day }}</span>
            <button
              type="button"
              class="cal-footer-book btn btn--ghost"
              [disabled]="cell().isPast"
              (click)="bookDay.emit(cell().date!)"
            >
              + Agendar
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class CalendarDayCellComponent {
  readonly cell = input.required<CalendarDayCellView>();
  readonly showBookFooter = input(true);
  readonly selected = output<number>();
  readonly bookDay = output<Date>();
}
