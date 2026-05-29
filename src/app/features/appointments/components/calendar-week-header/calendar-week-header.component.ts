import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-calendar-week-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal-month-header cal-week-header">
      <button type="button" class="btn btn--ghost" (click)="prev.emit()" aria-label="Semana anterior">
        ◀ Semana
      </button>
      <button type="button" class="btn btn--ghost" (click)="today.emit()">Hoy</button>
      <h2 class="cal-month-header__title cal-week-header__span">{{ spanLabel() }}</h2>
      <button type="button" class="btn btn--ghost" (click)="next.emit()" aria-label="Semana siguiente">
        Semana ▶
      </button>
    </div>
  `,
})
export class CalendarWeekHeaderComponent {
  readonly spanLabel = input.required<string>();
  readonly prev = output<void>();
  readonly next = output<void>();
  readonly today = output<void>();
}
