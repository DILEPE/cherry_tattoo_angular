import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { PanelUsersStore } from '../../panel-users.store';
import { PanelUsersToolbarComponent } from '../panel-users-toolbar/panel-users-toolbar.component';
import { PanelUsersListComponent } from '../panel-users-list/panel-users-list.component';
import { PanelUsersModalsHostComponent } from '../../dialogs/panel-users-modals-host/panel-users-modals-host.component';
import { UiStore } from '../../../../store/ui.store';
import { PanelUserModalData } from '../../models/panel-user-modal.model';
import { PanelUserRow, panelUserDisplayName } from '../../models/panel-user.model';
import { AppStore } from '../../../../store/app.store';

@Component({
  selector: 'app-panel-users-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PanelUsersStore],
  imports: [
    PanelUsersToolbarComponent,
    PanelUsersListComponent,
    PanelUsersModalsHostComponent,
  ],
  template: `
    <h2 class="pu-page-title">Gestión de usuarios del panel</h2>

    @if (!appStore.isAdmin()) {
      <p class="empty-state">No tienes permiso para gestionar usuarios del panel.</p>
    } @else {
      <details class="pu-help">
        <summary>Guía: cómo configurar un usuario del panel</summary>
        <ul class="pu-help__list">
          <li>
            <strong>Administrador:</strong> accede a todas las pestañas (citas, clientes, contratos,
            encuestas, reportes, tiendas y esta gestión de usuarios). No requiere marcar módulos.
          </li>
          <li>
            <strong>Vendedor, perforador o tatuador:</strong> debe tener al menos un
            <strong>módulo permitido</strong> marcado al crear o editar.
          </li>
          <li>
            Módulos disponibles: Gestión citas, clientes, contratos, encuesta, Gestión de reportes y
            Gestión de tiendas.
          </li>
          <li>
            El <strong>usuario de login</strong> solo se define al crear (minúsculas, mín. 3
            caracteres). La <strong>contraseña</strong> es obligatoria al crear (mín. 8).
          </li>
          <li>Cada usuario debe estar asociado a una <strong>tienda activa</strong>.</li>
          <li>Los usuarios <strong>inactivos</strong> no pueden iniciar sesión.</li>
        </ul>
      </details>

      <app-panel-users-toolbar (create)="openCreate()" />
      <app-panel-users-list (edit)="openEdit($event)" />
      <app-panel-users-modals-host />
    }
  `,
})
export class PanelUsersShellComponent {
  protected readonly store = inject(PanelUsersStore);
  protected readonly appStore = inject(AppStore);
  private readonly ui = inject(UiStore);

  private readonly _load = effect(() => {
    if (!this.appStore.isAdmin()) return;
    this.store.reloadToken();
    this.store.load();
    this.store.loadStores();
  });

  openCreate(): void {
    this.ui.openModal('user-create', {} satisfies PanelUserModalData);
  }

  openEdit(row: PanelUserRow): void {
    this.ui.openModal('user-edit', {
      userId: row.id,
      userLabel: panelUserDisplayName(row),
    } satisfies PanelUserModalData);
  }
}
