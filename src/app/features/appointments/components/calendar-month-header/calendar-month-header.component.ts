import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MONTHS_ES } from '../../models/calendar.model';

@Component({
  selector: 'app-calendar-month-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal-month-header">
      <button type="button" class="btn btn--ghost" (click)="prev.emit()" aria-label="Mes anterior">
        ◀
      </button>
      <h2 class="cal-month-header__title">{{ title() }}</h2>
      <button type="button" class="btn btn--ghost" (click)="next.emit()" aria-label="Mes siguiente">
        ▶
      </button>
      <button type="button" class="btn btn--ghost" (click)="today.emit()">Hoy</button>
    </div>
  `,
})
export class CalendarMonthHeaderComponent {
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  readonly prev = output<void>();
  readonly next = output<void>();
  readonly today = output<void>();

  title(): string {
    const m = this.month();
    const y = this.year();
    const label = MONTHS_ES[m - 1] ?? String(m);
    return `${label} ${y}`;
  }
}
