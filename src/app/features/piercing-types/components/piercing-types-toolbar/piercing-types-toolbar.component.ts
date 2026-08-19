import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

@Component({
  selector: 'app-piercing-types-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <div class="pt-toolbar">
      <app-button variant="primary" (clicked)="create.emit()">Nuevo tipo</app-button>
    </div>
  `,
})
export class PiercingTypesToolbarComponent {
  readonly create = output<void>();
}
