import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
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
          <app-pill [variant]="statusToPillVariant(a.status)" [label]="a.statusLabel" />
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
          <dt>Total</dt>
          <dd>{{ a.financials.totalFmt }}</dd>
          <dt>Abonado</dt>
          <dd>{{ a.financials.depositFmt }}</dd>
          <dt>Pendiente</dt>
          <dd>{{ a.financials.pendingFmt }}</dd>
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
  protected readonly statusToPillVariant = statusToPillVariant;
  protected readonly serviceToBadgeVariant = serviceToBadgeVariant;
  protected readonly reprogramDisabled = reprogramDisabledForRow;
  protected readonly canEditFinancials = canEditFinancials;
  protected readonly canCancelAppointment = canCancelAppointment;

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

  openSub(modalId: string): void {
    const a = this.appt();
    if (!a) return;
    this.ui.openModal(modalId, { appointmentId: a.id });
  }

  close(): void {
    this.ui.closeModal();
    this.dlg.reset();
  }
}
