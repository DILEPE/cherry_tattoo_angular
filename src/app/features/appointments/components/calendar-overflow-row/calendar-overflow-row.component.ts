import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarAppointmentSlotView } from '../../models/calendar.model';

@Component({
  selector: 'app-calendar-overflow-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal-overflow-row" [class.cal-overflow-row--muted]="slot().muted">
      <div class="cal-overflow-left">
        <span class="cal-overflow-hm">{{ slot().timeLabel }}</span>
        <span class="cal-overflow-sep">·</span>
        <span class="svc-flag {{ slot().serviceFlagClass }}" [title]="slot().serviceType">
          {{ slot().serviceType }}
        </span>
        <span class="cal-overflow-sep">·</span>
        <span class="cli-pill cli-pill-{{ slot().pillKind }}">{{ slot().customerShort }}</span>
        @if (slot().artistLabel !== 'Sin asignar') {
          <span class="cal-overflow-artist-dash">· Artista: {{ slot().artistLabel }}</span>
        }
        @if (slot().contractPending) {
          <span class="cal-overflow-fire-pending">Firma profesional pendiente</span>
        }
      </div>
      <span class="cal-overflow-total-wrap">
        <span class="cal-overflow-total-chip">
          <span class="cal-overflow-total-label">Total servicio</span>
          · {{ slot().totalFmt }}
        </span>
      </span>
      <button
        type="button"
        class="btn btn--ghost ap-overflow-open"
        (click)="open.emit(slot().id)"
      >
        Ficha
      </button>
    </div>
  `,
})
export class CalendarOverflowRowComponent {
  readonly slot = input.required<CalendarAppointmentSlotView>();
  readonly open = output<number>();
}
