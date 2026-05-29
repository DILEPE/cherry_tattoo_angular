import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { SurveysStore } from '../../surveys.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

@Component({
  selector: 'app-surveys-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <div class="sq-toolbar">
      <app-button variant="primary" (clicked)="create.emit()">Agregar pregunta</app-button>
      <app-button variant="ghost" [loading]="store.loading()" (clicked)="store.refresh()">
        Actualizar listado
      </app-button>
    </div>
  `,
})
export class SurveysToolbarComponent {
  protected readonly store = inject(SurveysStore);
  readonly create = output<void>();
}
