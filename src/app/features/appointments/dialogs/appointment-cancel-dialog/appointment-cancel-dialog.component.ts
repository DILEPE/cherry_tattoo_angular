import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
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
        Se va a <strong>cancelar</strong> esta cita. ¿Está seguro de cancelar la cita?
      </p>
      <div class="appt-dialog-actions">
        <app-button
          variant="primary"
          [loading]="saving()"
          [disabled]="!canCancelAppointment(a)"
          (clicked)="confirm()"
        >
          Sí
        </app-button>
        <app-button variant="ghost" (clicked)="close()">No</app-button>
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
    this.api.patchStatus(a.id, 'Cancelada', 'credito_cliente').subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Cita cancelada · #${a.id}`);
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
