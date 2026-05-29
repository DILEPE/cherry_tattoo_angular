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
    <div class="cal-appt-slot twg-cli-pill-{{ slot().pillKind }}">
      <div class="cal-appt-slot-body">
        <span class="cal-appt-slot-time">{{ slot().timeLabel }}</span>
        <span class="cal-appt-slot-client">{{ slot().customerShort }}</span>
        <span class="cal-appt-total" [title]="slot().totalFmt">{{ slot().totalCompact }}</span>
      </div>
      <button
        type="button"
        class="cal-appt-slot-link cal-query-nav"
        [attr.aria-label]="'Ver cita ' + slot().id"
        (click)="selected.emit(slot().id); $event.stopPropagation()"
      >
        <span class="cal-appt-slot-link-play" aria-hidden="true">▶</span>
        <span>Ver cita</span>
      </button>
    </div>
  `,
})
export class CalendarAppointmentSlotComponent {
  readonly slot = input.required<CalendarAppointmentSlotView>();
  readonly selected = output<number>();
}
