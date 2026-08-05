import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppointmentDetailDialogComponent } from '../appointment-detail-dialog/appointment-detail-dialog.component';
import { AppointmentRescheduleDialogComponent } from '../appointment-reschedule-dialog/appointment-reschedule-dialog.component';
import { AppointmentCancelDialogComponent } from '../appointment-cancel-dialog/appointment-cancel-dialog.component';
import { AppointmentFinancialsDialogComponent } from '../appointment-financials-dialog/appointment-financials-dialog.component';
import { AppointmentReceiptsDialogComponent } from '../appointment-receipts-dialog/appointment-receipts-dialog.component';
import { AppointmentBookDialogComponent } from '../appointment-book-dialog/appointment-book-dialog.component';
import { CalendarDayOverflowDialogComponent } from '../calendar-day-overflow-dialog/calendar-day-overflow-dialog.component';
import { AppointmentSearchDialogComponent } from '../appointment-search-dialog/appointment-search-dialog.component';
import { AppointmentFocusDialogComponent } from '../appointment-focus-dialog/appointment-focus-dialog.component';
import { AppointmentContractViewDialogComponent } from '../appointment-contract-view-dialog/appointment-contract-view-dialog.component';
import { BookAppointmentModalData } from '../../models/appointment-modal.model';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { formatAppointmentCreatedAtDisplay } from '../../models/appointment-detail-text.mapper';
import { statusToPillVariant } from '../../models/appointment.mapper';

@Component({
  selector: 'app-appointments-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppModalComponent,
    AppPillComponent,
    AppButtonComponent,
    AppointmentDetailDialogComponent,
    AppointmentRescheduleDialogComponent,
    AppointmentCancelDialogComponent,
    AppointmentFinancialsDialogComponent,
    AppointmentReceiptsDialogComponent,
    AppointmentBookDialogComponent,
    CalendarDayOverflowDialogComponent,
    AppointmentSearchDialogComponent,
    AppointmentFocusDialogComponent,
    AppointmentContractViewDialogComponent,
  ],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('appointment-detail') {
        @defer (on immediate) {
          <app-modal
            title="Cita"
            size="md"
            [isOpen]="true"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-appointment-detail-dialog />
          </app-modal>
        }
      }
      @case ('appointment-focus') {
        @defer (on immediate) {
          <app-modal
            title="Agendamiento Cita"
            [subtitle]="focusCreatedAtLabel()"
            size="lg"
            [isOpen]="true"
            [dismissible]="false"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            @if (dlg.appointment(); as a) {
              <div modalHeaderEnd class="modal-header-end">
                <app-pill [variant]="statusToPillVariant(a.status)" [label]="a.statusLabel" />
                @if (a.hasSignedContract) {
                  <app-button variant="ghost" (clicked)="openFocusContract(a.id)">
                    Ver contrato
                  </app-button>
                }
              </div>
            }
            <app-appointment-focus-dialog />
          </app-modal>
        }
      }
      @case ('appointment-reschedule') {
        @defer (on immediate) {
          <app-modal
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            title="Reprogramar cita"
            size="md"
            [isOpen]="true"
            (closed)="ui.closeModal()"
          >
            <app-appointment-reschedule-dialog />
          </app-modal>
        }
      }
      @case ('appointment-cancel') {
        @defer (on immediate) {
          <app-modal
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            title="Confirmar anulación"
            size="md"
            [isOpen]="true"
            (closed)="ui.closeModal()"
          >
            <app-appointment-cancel-dialog />
          </app-modal>
        }
      }
      @case ('appointment-financials') {
        @defer (on immediate) {
          <app-modal
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            title="Ajustar montos"
            size="md"
            [isOpen]="true"
            (closed)="ui.closeModal()"
          >
            <app-appointment-financials-dialog />
          </app-modal>
        }
      }
      @case ('appointment-receipts') {
        @defer (on immediate) {
          <app-modal
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            title="Recibos de pago (PDF)"
            size="lg"
            [isOpen]="true"
            (closed)="ui.closeModal()"
          >
            <app-appointment-receipts-dialog />
          </app-modal>
        }
      }
      @case ('appointment-book') {
        @defer (on immediate) {
          <app-modal
            [title]="bookModalTitle()"
            size="lg"
            [isOpen]="true"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-appointment-book-dialog />
          </app-modal>
        }
      }
      @case ('calendar-day-overflow') {
        @defer (on immediate) {
          <app-modal
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            title="Citas del día"
            size="md"
            [isOpen]="true"
            (closed)="ui.closeModal()"
          >
            <app-calendar-day-overflow-dialog />
          </app-modal>
        }
      }
      @case ('appointment-search') {
        @defer (on immediate) {
          <app-modal
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            title="Buscar cita"
            size="lg"
            [isOpen]="true"
            (closed)="ui.closeModal()"
          >
            <app-appointment-search-dialog />
          </app-modal>
        }
      }
      @case ('appointment-contract-view') {
        @defer (on immediate) {
          <app-modal
            title="Contrato firmado"
            size="lg"
            [isOpen]="true"
            [busy]="ui.globalLoading()"
            [busyMessage]="ui.loadingMessage() ?? 'Cargando…'"
            (closed)="ui.closeModal()"
          >
            <app-appointment-contract-view-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class AppointmentsModalsHostComponent {
  protected readonly ui = inject(UiStore);
  protected readonly dlg = inject(AppointmentDialogStore);
  protected readonly statusToPillVariant = statusToPillVariant;

  bookModalTitle(): string {
    const data = this.ui.activeModal()?.data as BookAppointmentModalData | undefined;
    return data?.express ? 'Cita express' : 'Agendar cita';
  }

  focusCreatedAtLabel(): string {
    const a = this.dlg.appointment();
    if (!a?.createdAt) return '';
    const label = formatAppointmentCreatedAtDisplay(a.createdAt);
    return label === '—' ? '' : label;
  }

  openFocusContract(appointmentId: number): void {
    this.ui.openModal('appointment-contract-view', { appointmentId });
  }
}
