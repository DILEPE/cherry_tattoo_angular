import { ChangeDetectionStrategy, Component } from '@angular/core';

const LEGEND_ITEMS: ReadonlyArray<{ kind: string; label: string }> = [
  { kind: 'cli-pill-returning', label: 'Activa cliente antiguo' },
  { kind: 'cli-pill-new', label: 'Activa cliente nuevo' },
  { kind: 'cli-pill-priority', label: 'Con prioridad' },
  { kind: 'cli-pill-reprogramada', label: 'Reprogramada' },
  { kind: 'cli-pill-cancelada', label: 'Cancelada' },
];

@Component({
  selector: 'app-calendar-legend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cita-legend-strip" role="group" aria-label="Leyenda de colores">
      @for (item of items; track item.kind) {
        <span class="cita-legend-item">
          <span class="cita-legend-swatch {{ item.kind }}" aria-hidden="true"></span>
          <span class="cita-legend-label">{{ item.label }}</span>
        </span>
      }
    </div>
  `,
})
export class CalendarLegendComponent {
  readonly items = LEGEND_ITEMS;
}
