import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PanelUsersStore } from '../../panel-users.store';
import { PanelUsersApiService } from '../../services/panel-users-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { PanelUserFormComponent } from '../../components/panel-user-form/panel-user-form.component';
import { PanelUserFormValue, PanelUserRow, isAdminRole } from '../../models/panel-user.model';
import { formToUpdatePayload } from '../../models/panel-user.mapper';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { AppStore } from '../../../../store/app.store';
import { resolvePanelUserModalId } from '../panel-user-modal.util';

@Component({
  selector: 'app-panel-user-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelUserFormComponent, AppButtonComponent, AppSkeletonComponent],
  template: `
    @if (loading()) {
      <app-skeleton [rows]="10" />
    } @else if (loadError()) {
      <p class="form-field__error">{{ loadError() }}</p>
      <div class="appt-dialog-actions">
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      </div>
    } @else if (user()) {
      <app-panel-user-form
        [initial]="user()!"
        [initialModules]="modules()"
        [editMode]="true"
        (submitted)="save($event)"
      >
        <div actions class="appt-dialog-actions">
          <app-button type="submit" variant="primary" [loading]="saving()">Guardar cambios</app-button>
          <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
        </div>
      </app-panel-user-form>
    }
  `,
})
export class PanelUserEditDialogComponent {
  private readonly api = inject(PanelUsersApiService);
  private readonly store = inject(PanelUsersStore);
  private readonly ui = inject(UiStore);
  private readonly appStore = inject(AppStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly user = signal<PanelUserRow | null>(null);
  readonly modules = signal<PanelUserFormValue['moduleKeys']>([]);
  readonly saving = signal(false);

  private readonly _load = effect(() => {
    const id = resolvePanelUserModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'user-edit') return;
    this.loading.set(true);
    forkJoin({
      user: this.api.getById(id),
      modules: this.api.getModuleGrants(id),
    }).subscribe({
      next: ({ user, modules }) => {
        this.user.set(user);
        this.modules.set(modules);
        this.loadError.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set('No se pudo cargar el usuario.');
        this.errors.handle(err);
      },
    });
  });

  save(value: PanelUserFormValue): void {
    const id = resolvePanelUserModalId(this.ui);
    if (id <= 0) return;
    this.saving.set(true);
    const includePassword = value.password.trim().length > 0;
    const body = formToUpdatePayload(value, { includePassword });
    this.api.update(id, body).subscribe({
      next: () => {
        if (!isAdminRole(value.role)) {
          this.api.setModules(id, value.moduleKeys).subscribe({
            next: () => this.finishSuccess(id),
            error: (err) => {
              this.saving.set(false);
              this.errors.handle(err);
              this.toast.warn('Datos guardados, pero no se actualizaron los módulos.');
              this.store.invalidate();
              this.close();
            },
          });
          return;
        }
        this.finishSuccess(id);
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  private finishSuccess(userId: number): void {
    this.saving.set(false);
    const me = this.appStore.user()?.id;
    if (me != null && me === userId) {
      this.appStore.initFromSession();
    }
    this.toast.success('Usuario actualizado.');
    this.store.invalidate();
    this.close();
  }

  close(): void {
    this.ui.closeModal();
  }
}
