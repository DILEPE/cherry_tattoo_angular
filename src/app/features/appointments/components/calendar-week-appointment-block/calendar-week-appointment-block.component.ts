import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WeekAppointmentBlockView } from '../../models/calendar.model';

@Component({
  selector: 'app-calendar-week-appointment-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="twg-appt twg-cli-pill-{{ block().pillKind }}"
      [class.twg-appt--single-slot]="block().singleSlot"
      [class.twg-cancelada-soft]="block().muted"
      [title]="block().tooltip"
      [attr.aria-label]="block().tooltip"
      [style.top.px]="block().topPx"
      [style.height.px]="block().heightPx"
      [style.left.%]="block().leftPct"
      [style.width]="widthStyle()"
      [style.margin-left.px]="1"
      (click)="selected.emit(block().appointmentId)"
    >
      <span class="twg-appt-head-time">{{ block().timeLabel }}</span>
      <span class="twg-appt-body">
        <span class="twg-appt-client">{{ block().customerName }}</span>
        <span class="cal-appt-total">{{ block().totalCompact }}</span>
      </span>
    </button>
  `,
})
export class CalendarWeekAppointmentBlockComponent {
  readonly block = input.required<WeekAppointmentBlockView>();
  readonly selected = output<number>();

  widthStyle(): string {
    return `calc(${this.block().widthPct}% - 3px)`;
  }
}
