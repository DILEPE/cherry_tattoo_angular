import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';
import { AppBadgeComponent } from '../../../../shared/ui/badge/app-badge.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';
import { statusToPillVariant, serviceToBadgeVariant } from '../../models/appointment.mapper';
import { appointmentTimeHm } from '../../models/calendar.mapper';
import { inferWorkKindFromAppointment } from '../../models/booking.mapper';
import { appointmentDetailPlainBody } from '../../models/appointment-detail-text.mapper';
import { resolveAppointmentPiercingPlacementLabel } from '../../models/piercing-type-catalog';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { resolveAppointmentModalId } from '../appointment-modal.util';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppPillComponent,
    AppBadgeComponent,
    AppButtonComponent,
    AppSkeletonComponent,
    DateEsPipe,
  ],
  template: `
    @if (dlg.loading()) {
      <app-skeleton [rows]="4" />
    } @else if (dlg.error()) {
      <p class="form-field__error">{{ dlg.error() }}</p>
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    } @else {
      @if (appt(); as a) {
        <div class="appt-detail">
          <div class="appt-detail__header">
            <div class="appt-detail__status">
              <app-pill [variant]="statusToPillVariant(a.status)" [label]="a.statusLabel" />
              @if (a.hasSignedContract) {
                <app-button variant="ghost" (clicked)="openContractView()">Ver contrato</app-button>
              }
            </div>
          </div>

          <dl class="appt-detail__grid">
            <dt>Cliente</dt>
            <dd>{{ a.customerName }}</dd>
            <dt>Teléfono</dt>
            <dd>{{ a.phone || '—' }}</dd>
            <dt>Servicio</dt>
            <dd>
              <app-badge [variant]="serviceToBadgeVariant(a.serviceType)" [label]="a.serviceType" />
            </dd>
            @if (showPiercingPlacement()) {
              <dt>Tipo de colocación</dt>
              <dd>{{ piercingPlacementLabel() || '—' }}</dd>
            }
            <dt>Fecha</dt>
            <dd>
              {{ a.appointmentDate | dateEs }}
              @if (timeLabel()) {
                · {{ timeLabel() }}
              }
            </dd>
            <dt>Artista</dt>
            <dd>{{ a.assignedLabel }}</dd>
          </dl>

          <div class="appt-fin-summary">
            <div class="appt-fin-summary__item">
              <span class="appt-fin-summary__label">Total servicio</span>
              <strong>{{ a.financials.totalFmt }}</strong>
            </div>
            <div class="appt-fin-summary__item">
              <span class="appt-fin-summary__label">Abonado</span>
              <strong>{{ a.financials.depositFmt }}</strong>
            </div>
            <div class="appt-fin-summary__item" [class.appt-fin-summary__item--pending]="a.financials.pending > 0">
              <span class="appt-fin-summary__label">Pendiente</span>
              <strong>{{ a.financials.pendingFmt }}</strong>
            </div>
            @if (a.financials.credit > 0) {
              <div class="appt-fin-summary__item">
                <span class="appt-fin-summary__label">Saldo a favor</span>
                <strong>{{ a.financials.creditFmt }}</strong>
              </div>
            }
          </div>
          @if (a.contractPendingArtistSignature) {
            <p class="cal-overflow-fire-pending appt-detail-fire">Firma profesional pendiente</p>
          }

          <dl class="appt-detail__grid appt-detail__grid--after-fin">
            @if (detailPlain()) {
              <dt>Detalle</dt>
              <dd>{{ detailPlain() }}</dd>
            }
          </dl>

          <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
        </div>
      }
    }
  `,
})
export class AppointmentDetailDialogComponent {
  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly ui = inject(UiStore);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly apptApi = inject(AppointmentsApiService);
  protected readonly statusToPillVariant = statusToPillVariant;
  protected readonly serviceToBadgeVariant = serviceToBadgeVariant;

  readonly appt = this.dlg.appointment;
  private readonly fetchedPiercingLabels = signal<Record<number, string>>({});

  readonly showPiercingPlacement = computed(() => {
    const a = this.appt();
    return !!a && inferWorkKindFromAppointment(a) === 'piercing';
  });

  readonly piercingPlacementLabel = computed(() => {
    const a = this.appt();
    if (!a || !this.showPiercingPlacement()) return null;
    const merged = {
      ...this.apptStore.piercingTypeLabels(),
      ...this.fetchedPiercingLabels(),
    };
    return resolveAppointmentPiercingPlacementLabel(a, merged);
  });

  readonly detailPlain = computed(() => {
    const a = this.appt();
    if (!a?.detail) return '';
    return appointmentDetailPlainBody(a.detail);
  });

  private readonly _load = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id > 0 && this.ui.activeModal()?.id === 'appointment-detail') {
      const cached = this.apptStore.filteredItems().find((x) => x.id === id);
      if (cached) {
        this.dlg.patchAppointmentLocal(cached);
      }
      this.dlg.loadAppointment(id);
      this.dlg.loadPayments(id);
    }
  });

  private readonly _loadPiercingType = effect(() => {
    const a = this.appt();
    const modal = this.ui.activeModal()?.id;
    if (modal !== 'appointment-detail' || !a || a.id <= 0) return;
    if (inferWorkKindFromAppointment(a) !== 'piercing') {
      this.fetchedPiercingLabels.set({});
      return;
    }
    const fromStore = this.apptStore.piercingTypeLabels()[a.id];
    if (fromStore?.trim()) return;
    const id = a.id;
    this.apptApi
      .getWorkPerformedLabels([id])
      .pipe(catchError(() => of({} as Record<number, string>)))
      .subscribe((labels) => {
        if (this.appt()?.id !== id) return;
        this.fetchedPiercingLabels.set(labels);
      });
  });

  timeLabel(): string {
    const a = this.appt();
    if (!a) return '';
    return appointmentTimeHm(a.appointmentDateRaw ?? a.appointmentDate);
  }

  openContractView(): void {
    const a = this.appt();
    if (!a?.hasSignedContract) return;
    this.ui.openModal('appointment-contract-view', { appointmentId: a.id });
  }

  close(): void {
    this.ui.closeModal();
    this.dlg.reset();
  }
}
