import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { PanelUserCreateDialogComponent } from '../panel-user-create-dialog/panel-user-create-dialog.component';
import { PanelUserEditDialogComponent } from '../panel-user-edit-dialog/panel-user-edit-dialog.component';
import { resolvePanelUserModalData } from '../panel-user-modal.util';

@Component({
  selector: 'app-panel-users-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppModalComponent, PanelUserCreateDialogComponent, PanelUserEditDialogComponent],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('user-create') {
        @defer (on immediate) {
          <app-modal
            title="Registrar usuario del panel"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            (closed)="ui.closeModal()"
          >
            <app-panel-user-create-dialog />
          </app-modal>
        }
      }
      @case ('user-edit') {
        @defer (on immediate) {
          <app-modal
            [title]="'Editar: ' + (modalData().userLabel || 'usuario')"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            (closed)="ui.closeModal()"
          >
            <app-panel-user-edit-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class PanelUsersModalsHostComponent {
  protected readonly ui = inject(UiStore);
  protected readonly modalData = () => resolvePanelUserModalData(this.ui);
}
