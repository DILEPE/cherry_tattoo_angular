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
        [class.cal-cell--team]="cell().teamGroups.length > 0"
      >
        <div class="cal-cell-head">
          <span class="cal-cell-daynum">{{ cell().day }}</span>
        </div>
        <div class="cal-day-inner">
          @if (!cell().allSlots.length) {
            <div class="cal-day-empty">—</div>
          } @else if (cell().teamGroups.length) {
            @for (group of cell().teamGroups; track group.staffLabel) {
              <div class="cal-team-block">
                <div class="cal-team-label">{{ group.staffLabel }}</div>
                <div class="cal-team-lines">
                  @for (slot of group.slots; track slot.id) {
                    <app-calendar-appointment-slot
                      [slot]="slot"
                      (selected)="selected.emit($event)"
                    />
                  }
                </div>
              </div>
            }
          } @else {
            @for (slot of cell().slots; track slot.id) {
              <app-calendar-appointment-slot
                [slot]="slot"
                (selected)="selected.emit($event)"
              />
            }
            @if (cell().hiddenCount > 0) {
              <button
                type="button"
                class="cal-overflow-more btn btn--ghost"
                (click)="overflowDay.emit(cell().date!)"
              >
                +{{ cell().hiddenCount }} citas
              </button>
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
  readonly overflowDay = output<Date>();
}
