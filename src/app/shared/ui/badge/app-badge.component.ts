import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ServiceBadgeVariant = 'tattoo' | 'piercing' | 'limpieza' | 'cambio' | 'other';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"badge badge--" + variant()',
  },
  template: `<span>{{ label() }}</span>`,
  styles: [`:host { display: inline-block; }`],
})
export class AppBadgeComponent {
  readonly variant = input<ServiceBadgeVariant>('other');
  readonly label = input.required<string>();
}
