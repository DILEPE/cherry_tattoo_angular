import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { StoresApiService } from '../../../../core/services/stores-api.service';

import { StoresStore } from '../../stores.store';

import { UiStore } from '../../../../store/ui.store';

import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

import { resolveStoreModalId, resolveStoreModalName } from '../store-modal.util';

import { ToastService } from '../../../../shared/ui/toast/toast.service';

import { ErrorService } from '../../../../core/services/error.service';



@Component({

  selector: 'app-store-delete-dialog',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [AppButtonComponent],

  template: `

    <p class="appt-dialog-warning">

      ¿Eliminar <strong>{{ name() || 'la tienda seleccionada' }}</strong> del catálogo?

      No se puede si hay usuarios del panel asignados a esta tienda.

    </p>

    <div class="appt-dialog-actions">

      <app-button variant="primary" [loading]="saving()" (clicked)="confirm()">Eliminar</app-button>

      <app-button variant="ghost" (clicked)="close()">Cancelar</app-button>

    </div>

  `,

})

export class StoreDeleteDialogComponent {

  private readonly api = inject(StoresApiService);

  private readonly store = inject(StoresStore);

  private readonly ui = inject(UiStore);

  private readonly toast = inject(ToastService);

  private readonly errors = inject(ErrorService);



  readonly saving = signal(false);

  readonly name = signal(resolveStoreModalName(this.ui));



  confirm(): void {

    const id = resolveStoreModalId(this.ui);

    if (id <= 0) return;

    this.saving.set(true);

    this.api.delete(id).subscribe({

      next: () => {

        this.saving.set(false);

        this.toast.success(`Tienda eliminada · ${this.name() || id}`);

        this.store.invalidate();

        this.close();

      },

      error: (err) => {

        this.saving.set(false);

        this.errors.handle(err);

      },

    });

  }



  close(): void {

    this.ui.closeModal();

  }

}


