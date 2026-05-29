import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ContractsStore } from '../../contracts.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

@Component({
  selector: 'app-contracts-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <div class="ct-toolbar">
      <app-button variant="primary" (clicked)="create.emit()">➕ Nueva versión</app-button>
      <label class="ct-toolbar__check">
        <input
          type="checkbox"
          [checked]="store.onlyActive()"
          (change)="onOnlyActive($event)"
        />
        Solo activas
      </label>
      <app-button variant="ghost" (clicked)="store.refresh()">Actualizar listado</app-button>
    </div>
  `,
})
export class ContractsToolbarComponent {
  protected readonly store = inject(ContractsStore);
  readonly create = output<void>();

  onOnlyActive(ev: Event): void {
    this.store.setOnlyActive((ev.target as HTMLInputElement).checked);
  }
}
