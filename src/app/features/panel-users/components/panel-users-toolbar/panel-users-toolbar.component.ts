import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { PanelUsersStore } from '../../panel-users.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

@Component({
  selector: 'app-panel-users-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <div class="pu-toolbar">
      <app-button variant="primary" (clicked)="create.emit()">Crear usuario</app-button>
      <app-button variant="ghost" [loading]="store.loading()" (clicked)="store.refresh()">
        Actualizar listado
      </app-button>
    </div>
  `,
})
export class PanelUsersToolbarComponent {
  protected readonly store = inject(PanelUsersStore);
  readonly create = output<void>();
}
