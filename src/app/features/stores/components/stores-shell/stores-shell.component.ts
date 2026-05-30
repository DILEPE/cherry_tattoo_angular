import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';

import { StoresStore } from '../../stores.store';

import { StoresToolbarComponent } from '../stores-toolbar/stores-toolbar.component';

import { StoresListComponent } from '../stores-list/stores-list.component';

import { StoresModalsHostComponent } from '../../dialogs/stores-modals-host/stores-modals-host.component';

import { UiStore } from '../../../../store/ui.store';

import { StoreModalData } from '../../models/store-modal.model';

import { Store } from '../../../../core/models/store.model';

import { AppStore } from '../../../../store/app.store';



@Component({

  selector: 'app-stores-shell',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  providers: [StoresStore],

  imports: [StoresToolbarComponent, StoresListComponent, StoresModalsHostComponent],

  template: `

    <h2 class="st-page-title">Gestión de tiendas</h2>



    @if (!appStore.canAccessModule('tiendas')) {

      <p class="empty-state">No tienes permiso para gestionar tiendas.</p>

    } @else {

      <p class="st-page-caption">

        Define las tiendas del negocio (Cherry Tattoo, Rock City, sucursales…). Los usuarios del

        panel eligen una tienda al registrarse o al editarlos en

        <strong>Gestión de usuarios</strong>.

      </p>



      <app-stores-toolbar (create)="openCreate()" />

      <app-stores-list (edit)="openEdit($event)" (delete)="openDelete($event)" />

      <app-stores-modals-host />

    }

  `,

})

export class StoresShellComponent {

  protected readonly store = inject(StoresStore);

  protected readonly appStore = inject(AppStore);

  private readonly ui = inject(UiStore);



  private readonly _load = effect(() => {

    if (!this.appStore.canAccessModule('tiendas')) return;

    this.store.reloadToken();

    this.store.load();

  });



  openCreate(): void {

    this.ui.openModal('store-create', {} satisfies StoreModalData);

  }



  openEdit(row: Store): void {

    this.ui.openModal('store-edit', {

      storeId: row.id,

      storeName: row.name,

    } satisfies StoreModalData);

  }



  openDelete(row: Store): void {

    this.ui.openModal('store-delete', {

      storeId: row.id,

      storeName: row.name,

    } satisfies StoreModalData);

  }

}


