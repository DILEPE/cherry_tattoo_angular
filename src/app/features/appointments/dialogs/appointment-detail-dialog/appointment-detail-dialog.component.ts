import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';
import { AppBadgeComponent } from '../../../../shared/ui/badge/app-badge.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';
import { statusToPillVariant, serviceToBadgeVariant } from '../../models/appointment.mapper';
import {
  canCancelAppointment,
  canEditFinancials,
  firmarContratoDisabled,
  firmarContratoLabel,
  reprogramDisabledForRow,
} from '../../models/appointment-policy';
import { appointmentTimeHm } from '../../models/calendar.mapper';
import { resolveAppointmentModalId } from '../appointment-modal.util';
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
          <h3>Cita #{{ a.id }}</h3>
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
          @if (a.detail) {
            <dt>Detalle</dt>
            <dd>{{ a.detail }}</dd>
          }
        </dl>

        <div class="appt-detail__actions">
          <app-button
            variant="primary"
            [disabled]="reprogramDisabled(a)"
            (clicked)="openSub('appointment-reschedule')"
          >
            Reprogramar
          </app-button>
          <app-button
            variant="ghost"
            [disabled]="!canEditFinancials(a)"
            (clicked)="openSub('appointment-financials')"
          >
            Ajustar montos
          </app-button>
          <app-button variant="ghost" (clicked)="openSub('appointment-receipts')">
            Recibos PDF
          </app-button>
          <app-button
            variant="ghost"
            [disabled]="!canCancelAppointment(a)"
            (clicked)="openSub('appointment-cancel')"
          >
            Anular cita
          </app-button>
          <app-button
            variant="ghost"
            [disabled]="firmarContratoDisabled(a)"
            (clicked)="openSignContract()"
          >
            {{ firmarContratoLabel(a) }}
          </app-button>
        </div>
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
  private readonly router = inject(Router);
  protected readonly statusToPillVariant = statusToPillVariant;
  protected readonly serviceToBadgeVariant = serviceToBadgeVariant;
  protected readonly reprogramDisabled = reprogramDisabledForRow;
  protected readonly canEditFinancials = canEditFinancials;
  protected readonly canCancelAppointment = canCancelAppointment;
  protected readonly firmarContratoDisabled = firmarContratoDisabled;
  protected readonly firmarContratoLabel = firmarContratoLabel;

  readonly appt = this.dlg.appointment;

  private readonly _load = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id > 0 && this.ui.activeModal()?.id === 'appointment-detail') {
      const cached = this.apptStore
        .filteredItems()
        .find((x) => x.id === id);
      if (cached) {
        this.dlg.patchAppointmentLocal(cached);
      }
      this.dlg.loadAppointment(id);
    }
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

  openSub(modalId: string): void {
    const a = this.appt();
    if (!a) return;
    this.ui.openModal(modalId, { appointmentId: a.id });
  }

  openSignContract(): void {
    const a = this.appt();
    if (!a || firmarContratoDisabled(a)) return;
    const artistOnly = a.hasSignedContract && a.contractPendingArtistSignature;
    void this.router.navigate(['/citas', 'firmar', a.id], {
      queryParams: artistOnly ? { artistOnly: '1' } : {},
    });
    this.close();
  }

  close(): void {
    this.ui.closeModal();
    this.dlg.reset();
  }
}
