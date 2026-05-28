import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { formatCop } from '../../models/appointment.mapper';
import { canCancelAppointment } from '../../models/appointment-policy';
import { resolveAppointmentModalId } from '../appointment-modal.util';

@Component({
  selector: 'app-appointment-cancel-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    @if (dlg.appointment(); as a) {
      <p class="appt-dialog-warning">
        Vas a anular la cita #{{ a.id }} de <strong>{{ a.customerName }}</strong>.
        Artista: <strong>{{ a.assignedLabel }}</strong>. El estado pasará a
        <strong>Cancelada</strong>.
        @if (a.financials.deposit > 0) {
          Hay {{ a.financials.depositFmt }} abonados; dejan de contar en los totales de la cita.
        } @else {
          No hay abonos registrados en esta cita.
        }
      </p>
      <div class="appt-dialog-actions">
        <app-button
          variant="primary"
          [loading]="saving()"
          [disabled]="!canCancelAppointment(a)"
          (clicked)="confirm()"
        >
          Sí, anular
        </app-button>
        <app-button variant="ghost" (clicked)="close()">No, volver</app-button>
      </div>
    } @else if (dlg.loading()) {
      <p>Cargando…</p>
    }
  `,
})
export class AppointmentCancelDialogComponent {
  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly ui = inject(UiStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  readonly saving = signal(false);
  protected readonly canCancelAppointment = canCancelAppointment;
  protected readonly formatCop = formatCop;

  private readonly _load = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id > 0 && this.ui.activeModal()?.id === 'appointment-cancel') {
      this.dlg.loadAppointment(id);
    }
  });

  confirm(): void {
    const a = this.dlg.appointment();
    if (!a) return;
    this.saving.set(true);
    this.api.patchStatus(a.id, 'Cancelada', 'devolucion').subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Cita anulada · #${a.id}`);
        this.apptStore.invalidate();
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  close(): void {
    this.ui.closeModal();
  }
}
