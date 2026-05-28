import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"pill pill--" + variant()',
    '[attr.aria-label]': 'ariaLabel() ?? label()',
  },
  template: `<span>{{ label() }}</span>`,
  styles: [`:host { display: inline-flex; align-items: center; }`],
})
export class AppPillComponent {
  readonly variant = input<PillVariant>('neutral');
  readonly label = input.required<string>();
  readonly ariaLabel = input<string | null>(null);
}
