import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { formatCopAbono } from '../../models/appointment.mapper';
import { AppointmentReceipt } from '../../models/appointment.model';
import { resolveAppointmentModalId } from '../appointment-modal.util';

@Component({
  selector: 'app-appointment-receipts-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    @if (dlg.appointment(); as a) {
      <p class="appt-dialog-caption">
        <strong>Cita #{{ a.id }}</strong> · {{ a.customerName }}
      </p>
      <p class="empty-state appt-receipt-hint">
        Cada abono puede generar un recibo PDF en el servidor.
      </p>

      @if (dlg.receiptsLoading()) {
        <p>Cargando recibos…</p>
      } @else if (!dlg.receipts().length) {
        <p class="empty-state">Todavía no hay recibos para esta cita.</p>
      } @else {
        @for (r of dlg.receipts(); track r.id) {
          <div class="appt-receipt-row">
            <div>
              <strong>{{ kindLabel(r) }}</strong>
              · {{ (r.createdAt ?? '').slice(0, 19) || '—' }}
              · <strong>{{ formatCopAbono(r.amount) }}</strong>
            </div>
            <div class="appt-dialog-actions">
              <app-button variant="ghost" (clicked)="download(r)">Descargar PDF</app-button>
              <app-button variant="ghost" [loading]="resendingId() === r.id" (clicked)="askResend(r)">
                Enviar
              </app-button>
            </div>
            @if (sendChoiceId() === r.id) {
              <div class="ap-pay-send-choice">
                <p class="ap-ficha-caption">¿Cómo enviar este recibo?</p>
                <div class="ap-pay-send-choice-actions">
                  <app-button
                    [loading]="resendingId() === r.id && sendChoiceWithAmounts() === true"
                    (clicked)="confirmResend(r, true)"
                  >
                    Con valor de abono
                  </app-button>
                  <app-button
                    [loading]="resendingId() === r.id && sendChoiceWithAmounts() === false"
                    (clicked)="confirmResend(r, false)"
                  >
                    Sin valor de abono
                  </app-button>
                  <app-button variant="ghost" (clicked)="cancelResend()">Cancelar</app-button>
                </div>
              </div>
            }
          </div>
        }
      }
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    }
  `,
})
export class AppointmentReceiptsDialogComponent {
  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly ui = inject(UiStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  protected readonly formatCopAbono = formatCopAbono;
  readonly resendingId = signal<number | null>(null);
  readonly sendChoiceId = signal<number | null>(null);
  readonly sendChoiceWithAmounts = signal<boolean | null>(null);

  private readonly _load = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id > 0 && this.ui.activeModal()?.id === 'appointment-receipts') {
      this.dlg.loadAppointment(id);
      this.dlg.loadReceipts(id);
    }
  });

  kindLabel(r: AppointmentReceipt): string {
    return r.kind === 'inicial' ? 'Agenda / primer abono' : 'Abono adicional';
  }

  download(r: AppointmentReceipt): void {
    const a = this.dlg.appointment();
    if (!a) return;
    this.api.getReceiptPdf(a.id, r.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const aEl = document.createElement('a');
        aEl.href = url;
        aEl.download = `ORDEN DE TRABAJO.pdf`;
        aEl.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.errors.handle(err, 'No se pudo descargar el PDF'),
    });
  }

  askResend(r: AppointmentReceipt): void {
    this.sendChoiceId.set(r.id);
    this.sendChoiceWithAmounts.set(null);
  }

  cancelResend(): void {
    this.sendChoiceId.set(null);
    this.sendChoiceWithAmounts.set(null);
  }

  confirmResend(r: AppointmentReceipt, includeAbonoAmounts: boolean): void {
    const a = this.dlg.appointment();
    if (!a) return;
    this.sendChoiceWithAmounts.set(includeAbonoAmounts);
    this.resendingId.set(r.id);
    this.api.resendReceipt(a.id, r.id, includeAbonoAmounts).subscribe({
      next: () => {
        this.resendingId.set(null);
        this.sendChoiceId.set(null);
        this.sendChoiceWithAmounts.set(null);
        this.toast.success(
          includeAbonoAmounts
            ? 'Recibo enviado con valor de abono.'
            : 'Recibo enviado sin valor de abono.',
        );
      },
      error: (err) => {
        this.resendingId.set(null);
        this.sendChoiceWithAmounts.set(null);
        this.errors.handle(err);
      },
    });
  }

  close(): void {
    this.ui.closeModal();
  }
}
