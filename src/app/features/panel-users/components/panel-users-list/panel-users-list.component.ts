import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { PanelUsersStore } from '../../panel-users.store';
import { PanelUsersApiService } from '../../services/panel-users-api.service';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import {
  PanelUserRow,
  PANEL_ROLE_LABEL_ES,
  panelUserDisplayName,
} from '../../models/panel-user.model';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { AppStore } from '../../../../store/app.store';

@Component({
  selector: 'app-panel-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, AppIconActionButtonComponent],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="6" />
    } @else if (store.error()) {
      <p class="form-field__error">{{ store.error() }}</p>
    } @else if (!store.items().length) {
      <p class="empty-state">No hay usuarios del panel. Pulsa «Crear usuario» para registrar uno.</p>
    } @else {
      <p class="pu-list-meta"><strong>{{ store.count() }}</strong> usuario(s) del panel</p>
      <div class="pu-table-wrap">
        <table class="pu-table">
          <thead>
            <tr>
              <th><span class="pu-col-head">Nombre</span></th>
              <th><span class="pu-col-head">Usuario</span></th>
              <th><span class="pu-col-head">Tienda</span></th>
              <th><span class="pu-col-head">Rol</span></th>
              <th><span class="pu-col-head">Celular</span></th>
              <th><span class="pu-col-head">Activo</span></th>
              <th><span class="pu-col-head pu-col-head--actions">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of store.items(); track row.id) {
              <tr [class.pu-row--inactive]="!row.isActive">
                <td>{{ displayName(row) }}</td>
                <td>{{ row.username }}</td>
                <td>{{ row.storeName || '—' }}</td>
                <td>{{ roleLabel(row.role) }}</td>
                <td>{{ row.phone || '—' }}</td>
                <td>
                  <span class="pu-active-pill" [class.pu-active-pill--on]="row.isActive">
                    {{ row.isActive ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td class="pu-row-actions">
                  <div class="pu-row-actions__inner">
                    <button appIconAction="edit" title="Editar usuario" (click)="edit.emit(row)"></button>
                    @if (row.isActive) {
                      <button
                        appIconAction="userOff"
                        title="Desactivar usuario"
                        [disabled]="togglingId() !== null"
                        (click)="deactivate(row)"
                      ></button>
                    } @else {
                      <button
                        appIconAction="userPlus"
                        title="Activar usuario"
                        [disabled]="togglingId() !== null"
                        (click)="activate(row)"
                      ></button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class PanelUsersListComponent {
  protected readonly store = inject(PanelUsersStore);
  private readonly api = inject(PanelUsersApiService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly appStore = inject(AppStore);

  protected readonly displayName = panelUserDisplayName;
  protected readonly roleLabel = (r: keyof typeof PANEL_ROLE_LABEL_ES) => PANEL_ROLE_LABEL_ES[r];

  readonly togglingId = signal<number | null>(null);
  readonly edit = output<PanelUserRow>();

  activate(row: PanelUserRow): void {
    this.setActive(row, true);
  }

  deactivate(row: PanelUserRow): void {
    this.setActive(row, false);
  }

  private setActive(row: PanelUserRow, isActive: boolean): void {
    this.togglingId.set(row.id);
    this.api.setActive(row.id, isActive).subscribe({
      next: () => {
        this.togglingId.set(null);
        const me = this.appStore.user()?.id;
        if (me != null && me === row.id && !isActive) {
          this.toast.warn(
            'Has desactivado tu propio usuario: cuando salgas del panel no podrás iniciar sesión hasta que otro administrador te reactive.',
          );
        }
        this.toast.success(isActive ? 'Usuario activado.' : 'Usuario desactivado.');
        this.store.invalidate();
      },
      error: (err) => {
        this.togglingId.set(null);
        this.errors.handle(err);
      },
    });
  }
}
