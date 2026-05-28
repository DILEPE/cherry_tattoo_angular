import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarAppointmentSlotView } from '../../models/calendar.model';

@Component({
  selector: 'app-calendar-appointment-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.cal-appt-slot--muted]': 'slot().muted',
  },
  template: `
    <button
      type="button"
      class="cal-appt-slot twg-cli-pill-{{ slot().pillKind }}"
      [title]="slot().tooltip"
      (click)="selected.emit(slot().id)"
    >
      <span class="cal-appt-slot-time">{{ slot().timeLabel }}</span>
      <span class="cli-pill cli-pill-{{ slot().pillKind }} cal-appt-slot-client">
        {{ slot().customerShort }}
      </span>
      <span class="cal-appt-total">{{ slot().totalCompact }}</span>
    </button>
  `,
})
export class CalendarAppointmentSlotComponent {
  readonly slot = input.required<CalendarAppointmentSlotView>();
  readonly selected = output<number>();
}
