import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { PiercingTypeCreateDialogComponent } from '../piercing-type-create-dialog/piercing-type-create-dialog.component';
import { PiercingTypeEditDialogComponent } from '../piercing-type-edit-dialog/piercing-type-edit-dialog.component';
import { PiercingTypeDeleteDialogComponent } from '../piercing-type-delete-dialog/piercing-type-delete-dialog.component';
import { PiercingTypePreviewDialogComponent } from '../piercing-type-preview-dialog/piercing-type-preview-dialog.component';
import { PiercingTypeModalData } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-types-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppModalComponent,
    PiercingTypeCreateDialogComponent,
    PiercingTypeEditDialogComponent,
    PiercingTypeDeleteDialogComponent,
    PiercingTypePreviewDialogComponent,
  ],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('piercing-type-create') {
        @defer (on immediate) {
          <app-modal
            title="Nuevo tipo de piercing"
            size="md"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-piercing-type-create-dialog />
          </app-modal>
        }
      }
      @case ('piercing-type-edit') {
        @defer (on immediate) {
          <app-modal
            title="Editar tipo de piercing"
            size="md"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-piercing-type-edit-dialog />
          </app-modal>
        }
      }
      @case ('piercing-type-preview') {
        @defer (on immediate) {
          <app-modal
            [title]="previewTitle()"
            size="lg"
            [isOpen]="true"
            [dismissible]="true"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando PDF…'"
            (closed)="ui.closeModal()"
          >
            <app-piercing-type-preview-dialog />
          </app-modal>
        }
      }
      @case ('piercing-type-delete') {
        @defer (on immediate) {
          <app-modal
            title="Eliminar tipo"
            size="sm"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-piercing-type-delete-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class PiercingTypesModalsHostComponent {
  protected readonly ui = inject(UiStore);

  previewTitle(): string {
    const data = (this.ui.activeModal()?.data ?? {}) as PiercingTypeModalData;
    const label = String(data.label ?? '').trim();
    return label ? `Vista previa · ${label}` : 'Vista previa del PDF';
  }
}
