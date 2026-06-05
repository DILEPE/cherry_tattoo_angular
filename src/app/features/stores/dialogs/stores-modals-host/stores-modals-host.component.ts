import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UiStore } from '../../../../store/ui.store';

import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';

import { StoreCreateDialogComponent } from '../store-create-dialog/store-create-dialog.component';

import { StoreEditDialogComponent } from '../store-edit-dialog/store-edit-dialog.component';

import { StoreDeleteDialogComponent } from '../store-delete-dialog/store-delete-dialog.component';



@Component({

  selector: 'app-stores-modals-host',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [

    AppModalComponent,

    StoreCreateDialogComponent,

    StoreEditDialogComponent,

    StoreDeleteDialogComponent,

  ],

  template: `

    @switch (ui.activeModal()?.id) {

      @case ('store-create') {

        @defer (on immediate) {

          <app-modal
            title="Nueva tienda"
            size="md"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >

            <app-store-create-dialog />

          </app-modal>

        }

      }

      @case ('store-edit') {

        @defer (on immediate) {

          <app-modal
            title="Editar tienda"
            size="md"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >

            <app-store-edit-dialog />

          </app-modal>

        }

      }

      @case ('store-delete') {

        @defer (on immediate) {

          <app-modal
            title="Eliminar tienda"
            size="sm"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >

            <app-store-delete-dialog />

          </app-modal>

        }

      }

    }

  `,

})

export class StoresModalsHostComponent {

  protected readonly ui = inject(UiStore);

}


