import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarAppointmentSlotView } from '../../models/calendar.model';

@Component({
  selector: 'app-calendar-appointment-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="cal-appt-slot twg-cli-pill-{{ slot().pillKind }}"
      [class.cal-appt-slot--muted]="slot().muted"
      [title]="slot().tooltip"
      [attr.aria-label]="slot().tooltip"
      (click)="selected.emit(slot().id)"
    >
      <span class="cal-appt-slot-time">{{ slot().timeLabel }}</span>
      <span class="cal-appt-slot-row">
        <span class="cal-appt-slot-client">{{ slot().customerShort }}</span>
        <span class="cal-appt-total" [title]="slot().totalFmt">{{ slot().totalCompact }}</span>
      </span>
    </button>
  `,
})
export class CalendarAppointmentSlotComponent {
  readonly slot = input.required<CalendarAppointmentSlotView>();
  readonly selected = output<number>();
}
