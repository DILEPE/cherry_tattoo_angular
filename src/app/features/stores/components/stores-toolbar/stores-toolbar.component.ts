import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';

import { StoresStore } from '../../stores.store';

import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';



@Component({

  selector: 'app-stores-toolbar',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [AppButtonComponent],

  template: `

    <div class="st-toolbar">

      <app-button variant="primary" (clicked)="create.emit()">Nueva tienda</app-button>

      <app-button variant="ghost" [loading]="store.loading()" (clicked)="store.refresh()">

        Actualizar

      </app-button>

    </div>

  `,

})

export class StoresToolbarComponent {

  protected readonly store = inject(StoresStore);

  readonly create = output<void>();

}


