import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PanelUsersStore } from '../../panel-users.store';
import { PanelUsersApiService } from '../../services/panel-users-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { PanelUserFormComponent } from '../../components/panel-user-form/panel-user-form.component';
import { PanelUserFormValue, isAdminRole } from '../../models/panel-user.model';
import { formToCreatePayload } from '../../models/panel-user.mapper';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-panel-user-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelUserFormComponent, AppButtonComponent],
  template: `
    <app-panel-user-form (submitted)="save($event)">
      <div actions class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()">Registrar usuario</app-button>
        <app-button type="button" variant="ghost" (clicked)="close()">Cancelar</app-button>
      </div>
    </app-panel-user-form>
  `,
})
export class PanelUserCreateDialogComponent {
  private readonly api = inject(PanelUsersApiService);
  private readonly store = inject(PanelUsersStore);
  private readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);

  save(value: PanelUserFormValue): void {
    this.saving.set(true);
    const body = formToCreatePayload(value);
    this.api.create(body).subscribe({
      next: (newId) => {
        if (!isAdminRole(value.role) && newId > 0) {
          this.api.setModules(newId, value.moduleKeys).subscribe({
            next: () => this.finishSuccess(),
            error: (err) => {
              this.saving.set(false);
              this.errors.handle(err);
              this.toast.warn(
                'Usuario creado, pero no se pudieron guardar los módulos permitidos.',
              );
              this.store.invalidate();
              this.close();
            },
          });
          return;
        }
        this.finishSuccess();
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  private finishSuccess(): void {
    this.saving.set(false);
    this.toast.success('Usuario registrado correctamente.');
    this.store.invalidate();
    this.close();
  }

  close(): void {
    this.ui.closeModal();
  }
}
