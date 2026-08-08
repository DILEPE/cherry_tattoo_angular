import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { PiercingTypesStore } from '../../piercing-types.store';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import { PiercingTypeRow } from '../../models/piercing-type.model';
import { formatPdfSize } from '../../models/piercing-type.mapper';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-piercing-types-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSkeletonComponent, AppIconActionButtonComponent, DateEsPipe],
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="6" />
    } @else if (store.error()) {
      <p class="form-field__error">{{ store.error() }}</p>
    } @else if (!store.items().length) {
      <p class="empty-state">
        No hay tipos registrados. Pulsa «Nuevo tipo» para agregar uno con su PDF de cuidados.
      </p>
    } @else {
      <p class="pt-list-meta"><strong>{{ store.count() }}</strong> tipo(s) con PDF</p>
      <div class="pt-table-wrap">
        <table class="pt-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Archivo PDF</th>
              <th>Tamaño</th>
              <th>Actualizado</th>
              <th class="pt-col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (row of store.items(); track row.label) {
              <tr>
                <td>
                  {{ row.label }}
                  @if (row.isTattoo) {
                    <span class="pt-tag">Tatuaje</span>
                  }
                </td>
                <td>{{ row.sourceFilename }}</td>
                <td>{{ sizeLabel(row.pdfBytes) }}</td>
                <td>{{ row.updatedAt | dateEs }}</td>
                <td class="pt-row-actions">
                  <button
                    appIconAction="document"
                    title="Vista previa del PDF"
                    (click)="preview.emit(row)"
                  ></button>
                  <button appIconAction="edit" title="Editar" (click)="edit.emit(row)"></button>
                  <button appIconAction="trash" title="Eliminar" (click)="delete.emit(row)"></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class PiercingTypesListComponent {
  protected readonly store = inject(PiercingTypesStore);
  protected readonly sizeLabel = formatPdfSize;

  readonly edit = output<PiercingTypeRow>();
  readonly delete = output<PiercingTypeRow>();
  readonly preview = output<PiercingTypeRow>();
}
