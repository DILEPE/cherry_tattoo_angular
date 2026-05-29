import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';
import { AppointmentDetailDialogComponent } from '../appointment-detail-dialog/appointment-detail-dialog.component';
import { AppointmentRescheduleDialogComponent } from '../appointment-reschedule-dialog/appointment-reschedule-dialog.component';
import { AppointmentCancelDialogComponent } from '../appointment-cancel-dialog/appointment-cancel-dialog.component';
import { AppointmentFinancialsDialogComponent } from '../appointment-financials-dialog/appointment-financials-dialog.component';
import { AppointmentReceiptsDialogComponent } from '../appointment-receipts-dialog/appointment-receipts-dialog.component';
import { AppointmentBookDialogComponent } from '../appointment-book-dialog/appointment-book-dialog.component';
import { CalendarDayOverflowDialogComponent } from '../calendar-day-overflow-dialog/calendar-day-overflow-dialog.component';
import { AppointmentSearchDialogComponent } from '../appointment-search-dialog/appointment-search-dialog.component';
import { AppointmentFocusDialogComponent } from '../appointment-focus-dialog/appointment-focus-dialog.component';

@Component({
  selector: 'app-appointments-modals-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppModalComponent,
    AppointmentDetailDialogComponent,
    AppointmentRescheduleDialogComponent,
    AppointmentCancelDialogComponent,
    AppointmentFinancialsDialogComponent,
    AppointmentReceiptsDialogComponent,
    AppointmentBookDialogComponent,
    CalendarDayOverflowDialogComponent,
    AppointmentSearchDialogComponent,
    AppointmentFocusDialogComponent,
  ],
  template: `
    @switch (ui.activeModal()?.id) {
      @case ('appointment-detail') {
        @defer (on immediate) {
          <app-modal title="Cita" size="md" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-detail-dialog />
          </app-modal>
        }
      }
      @case ('appointment-focus') {
        @defer (on immediate) {
          <app-modal title="Cita" size="lg" [isOpen]="true" [dismissible]="false" (closed)="ui.closeModal()">
            <app-appointment-focus-dialog />
          </app-modal>
        }
      }
      @case ('appointment-reschedule') {
        @defer (on immediate) {
          <app-modal title="Reprogramar cita" size="md" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-reschedule-dialog />
          </app-modal>
        }
      }
      @case ('appointment-cancel') {
        @defer (on immediate) {
          <app-modal title="Confirmar anulación" size="md" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-cancel-dialog />
          </app-modal>
        }
      }
      @case ('appointment-financials') {
        @defer (on immediate) {
          <app-modal title="Ajustar montos" size="md" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-financials-dialog />
          </app-modal>
        }
      }
      @case ('appointment-receipts') {
        @defer (on immediate) {
          <app-modal title="Recibos de pago (PDF)" size="lg" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-receipts-dialog />
          </app-modal>
        }
      }
      @case ('appointment-book') {
        @defer (on immediate) {
          <app-modal title="Agendar cita" size="lg" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-book-dialog />
          </app-modal>
        }
      }
      @case ('calendar-day-overflow') {
        @defer (on immediate) {
          <app-modal title="Citas del día" size="md" [isOpen]="true" (closed)="ui.closeModal()">
            <app-calendar-day-overflow-dialog />
          </app-modal>
        }
      }
      @case ('appointment-search') {
        @defer (on immediate) {
          <app-modal title="Buscar cita" size="lg" [isOpen]="true" (closed)="ui.closeModal()">
            <app-appointment-search-dialog />
          </app-modal>
        }
      }
    }
  `,
})
export class AppointmentsModalsHostComponent {
  protected readonly ui = inject(UiStore);
}
