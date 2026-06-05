import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppIconComponent, AppIconName } from '../icon/app-icon.component';

@Component({
  selector: 'button[appIconAction]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIconComponent],
  host: {
    type: 'button',
    class: 'table-action-btn',
    '[attr.title]': 'title()',
    '[attr.aria-label]': 'title()',
    '[disabled]': 'disabled()',
  },
  template: `<app-icon [name]="icon()" [size]="iconSize()" />`,
})
export class AppIconActionButtonComponent {
  readonly icon = input.required<AppIconName>({ alias: 'appIconAction' });
  readonly title = input.required<string>();
  readonly disabled = input(false);
  readonly iconSize = input(16);
}
