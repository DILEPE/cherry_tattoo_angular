import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { apiErrorMessage } from '../../../../core/services/api.service';
import {
  APPOINTMENT_SEARCH_FIELDS,
  APPOINTMENT_SEARCH_PAGE_SIZE,
  AppointmentSearchField,
  AppointmentSearchHit,
  AppointmentSearchResponse,
  formatSearchHitDatetime,
  searchHitArtistLabel,
} from '../../models/appointment-search.model';
import { AppointmentApiRow } from '../../models/appointment.model';
import { openAppointmentModal } from '../appointment-open.util';

@Component({
  selector: 'app-appointment-search-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, AppSkeletonComponent],
  template: `
    <div class="ap-search-toolbar">
      <div class="ap-search-toolbar__row">
        <label>
          Buscar por *
          <select [(ngModel)]="field">
            @for (opt of fieldOptions; track opt.key) {
              <option [value]="opt.key">{{ opt.label }}</option>
            }
          </select>
        </label>
        <label class="ap-search-toolbar__q">
          Valor para buscar *
          <input
            type="search"
            [(ngModel)]="query"
            placeholder="Texto a buscar"
            (keydown.enter)="runSearch(0)"
          />
        </label>
        <app-button variant="primary" [disabled]="loading()" (clicked)="runSearch(0)">
          Buscar
        </app-button>
      </div>
    </div>

    @if (error()) {
      <p class="form-field__error ap-search-msg">{{ error() }}</p>
    }

    @if (loading()) {
      <app-skeleton [rows]="4" />
    } @else if (result()) {
      <p class="ap-search-table-title">Citas</p>
      <div class="ap-search-table-wrap">
        <table class="ap-search-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Recibo #</th>
              <th>Cliente</th>
              <th>Artista</th>
              <th>Ver cita</th>
            </tr>
          </thead>
          <tbody>
            @for (hit of result()!.items; track hit.id) {
              <tr>
                <td>{{ formatHitDate(hit) }}</td>
                <td>{{ hit.receipt_label || '—' }}</td>
                <td>{{ hit.customer_name || '—' }}</td>
                <td>{{ formatHitArtist(hit) }}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn--ghost ap-search-go"
                    title="Abrir ficha de la cita"
                    [disabled]="navigatingId() === hit.id"
                    (click)="openAppointment(hit)"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (!result()!.items.length) {
        <p class="ap-search-caption">Sin resultados para este criterio.</p>
      } @else {
        <div class="ap-search-pagination">
          <button
            type="button"
            class="btn btn--ghost"
            [disabled]="page() <= 0 || loading()"
            (click)="runSearch(page() - 1)"
          >
            ◀
          </button>
          <span class="ap-search-pagination-info">
            ({{ page() + 1 }} de {{ totalPages() }}) · {{ result()!.total }} cita(s)
          </span>
          <button
            type="button"
            class="btn btn--ghost"
            [disabled]="page() + 1 >= totalPages() || loading()"
            (click)="runSearch(page() + 1)"
          >
            ▶
          </button>
        </div>
      }
    }

    <div class="appt-dialog-actions">
      <app-button variant="ghost" (clicked)="close()">Cancelar</app-button>
    </div>
  `,
})
export class AppointmentSearchDialogComponent {
  private readonly store = inject(AppointmentsStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly ui = inject(UiStore);

  readonly fieldOptions = (
    Object.entries(APPOINTMENT_SEARCH_FIELDS) as [AppointmentSearchField, string][]
  ).map(([key, label]) => ({ key, label }));

  field: AppointmentSearchField = 'name';
  query = '';
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly navigatingId = signal(0);
  readonly error = signal<string | null>(null);
  readonly result = signal<AppointmentSearchResponse | null>(null);

  formatHitDate(hit: AppointmentSearchHit): string {
    return formatSearchHitDatetime(hit.appointment_date);
  }

  formatHitArtist(hit: AppointmentSearchHit): string {
    return searchHitArtistLabel(hit);
  }

  totalPages(): number {
    const total = this.result()?.total ?? 0;
    return Math.max(1, Math.ceil(total / APPOINTMENT_SEARCH_PAGE_SIZE));
  }

  runSearch(page: number): void {
    const term = this.query.trim();
    if (!term) {
      this.result.set(null);
      this.error.set('Indica un valor para buscar.');
      return;
    }
    this.page.set(Math.max(0, page));
    this.loading.set(true);
    this.error.set(null);
    this.api
      .search({
        field: this.field,
        q: term,
        limit: APPOINTMENT_SEARCH_PAGE_SIZE,
        offset: this.page() * APPOINTMENT_SEARCH_PAGE_SIZE,
        assignedPanelUserId: this.store.assignedUserId(),
      })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.result.set(null);
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  openAppointment(hit: AppointmentSearchHit): void {
    const id = hit.id;
    if (id <= 0) return;
    this.navigatingId.set(id);
    this.api
      .get(id)
      .pipe(catchError(() => of(this.hitAsApiRow(hit))))
      .subscribe({
        next: (raw) => {
          this.store.mergeAppointment(raw);
          this.navigatingId.set(0);
          openAppointmentModal(this.ui, this.store, id);
        },
        error: () => {
          this.navigatingId.set(0);
        },
      });
  }

  close(): void {
    this.ui.closeModal();
  }

  private hitAsApiRow(hit: AppointmentSearchHit): AppointmentApiRow {
    return {
      id: hit.id,
      customer_name: hit.customer_name,
      appointment_date: hit.appointment_date,
      assigned_username: hit.assigned_username,
      assigned_first_name: hit.assigned_first_name,
      assigned_last_name: hit.assigned_last_name,
      assigned_panel_user_id: hit.assigned_panel_user_id,
    };
  }
}
