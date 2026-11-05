import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ErrorService } from '../../../../core/services/error.service';
import { formatCopAbono } from '../../models/appointment.mapper';
import { AppointmentReceipt } from '../../models/appointment.model';
import { resolveAppointmentModalId } from '../appointment-modal.util';
import { printPdfBlob } from '../../models/print-receipt.util';

@Component({
  selector: 'app-appointment-receipts-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    @if (dlg.appointment(); as a) {
      <p class="appt-dialog-caption">
        {{ a.customerName }}
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
              <app-button variant="ghost" [loading]="printingId() === r.id" (clicked)="print(r)">
                Imprimir
              </app-button>
            </div>
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
  private readonly errors = inject(ErrorService);

  protected readonly formatCopAbono = formatCopAbono;
  readonly printingId = signal<number | null>(null);

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

  print(r: AppointmentReceipt): void {
    const a = this.dlg.appointment();
    if (!a) return;
    this.printingId.set(r.id);
    this.api.getReceiptPdf(a.id, r.id, true, 'png').subscribe({
      next: (blob) => {
        this.printingId.set(null);
        printPdfBlob(blob);
      },
      error: (err) => {
        this.printingId.set(null);
        this.errors.handle(err, 'No se pudo abrir el recibo para imprimir.');
      },
    });
  }

  close(): void {
    this.ui.closeModal();
  }
}
