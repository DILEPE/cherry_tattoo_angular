import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { PiercingTypesStore } from '../../piercing-types.store';
import { PiercingTypesToolbarComponent } from '../piercing-types-toolbar/piercing-types-toolbar.component';
import { PiercingTypesListComponent } from '../piercing-types-list/piercing-types-list.component';
import { PiercingTypesModalsHostComponent } from '../../dialogs/piercing-types-modals-host/piercing-types-modals-host.component';
import { UiStore } from '../../../../store/ui.store';
import { AppStore } from '../../../../store/app.store';
import { PiercingTypeModalData, PiercingTypeRow } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-types-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PiercingTypesStore],
  imports: [
    PiercingTypesToolbarComponent,
    PiercingTypesListComponent,
    PiercingTypesModalsHostComponent,
  ],
  template: `
    <h2 class="pt-page-title">Tipos de piercing</h2>

    @if (!appStore.canAccessModule('tipos_piercing')) {
      <p class="empty-state">No tienes permiso para gestionar tipos de piercing.</p>
    } @else {
      <p class="pt-page-caption">
        Administra los tipos de perforación y su PDF de cuidados (el mismo que se envía al firmar el
        contrato). Al crear o renombrar un tipo, también se actualiza la pregunta de la encuesta de
        piercing.
      </p>

      <app-piercing-types-toolbar (create)="openCreate()" />
      <app-piercing-types-list
        (preview)="openPreview($event)"
        (edit)="openEdit($event)"
        (delete)="openDelete($event)"
      />
      <app-piercing-types-modals-host />
    }
  `,
})
export class PiercingTypesShellComponent {
  protected readonly store = inject(PiercingTypesStore);
  protected readonly appStore = inject(AppStore);
  private readonly ui = inject(UiStore);

  private readonly _load = effect(() => {
    if (!this.appStore.canAccessModule('tipos_piercing')) return;
    this.store.reloadToken();
    this.store.load();
  });

  openCreate(): void {
    this.ui.openModal('piercing-type-create', {} satisfies PiercingTypeModalData);
  }

  openPreview(row: PiercingTypeRow): void {
    this.ui.openModal('piercing-type-preview', {
      label: row.label,
      sourceFilename: row.sourceFilename,
    } satisfies PiercingTypeModalData);
  }

  openEdit(row: PiercingTypeRow): void {
    this.ui.openModal('piercing-type-edit', {
      label: row.label,
      sourceFilename: row.sourceFilename,
    } satisfies PiercingTypeModalData);
  }

  openDelete(row: PiercingTypeRow): void {
    this.ui.openModal('piercing-type-delete', {
      label: row.label,
      sourceFilename: row.sourceFilename,
    } satisfies PiercingTypeModalData);
  }
}
