import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppIconActionButtonComponent } from '../../../../shared/ui/icon-button/app-icon-action-button.component';
import {
  copToMiles,
  formatAmountTable,
  mapAppointment,
  milesToCop,
} from '../../models/appointment.mapper';
import { mapPaymentsToReceipts } from '../../models/payment-receipt.mapper';
import { AppStore } from '../../../../store/app.store';
import { AppointmentPayment } from '../../models/appointment.model';
import { apiErrorMessage } from '../../../../core/services/api.service';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function paidOnTableDisplay(p: AppointmentPayment): string {
  const raw = p.paidOn ?? p.createdAt ?? '';
  if (!raw) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw));
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  return String(raw).slice(0, 10);
}

@Component({
  selector: 'app-appointment-abonos-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, AppIconActionButtonComponent],
  template: `
    <div class="ap-pay-panel-root">
      <div class="ap-pay-panel-title">
        <span>Abonos</span>
        <button
          type="button"
          class="ap-pay-toggle-btn"
          [attr.aria-expanded]="expanded()"
          (click)="expanded.set(!expanded())"
        >
          {{ expanded() ? '−' : '+' }}
        </button>
      </div>

      @if (expanded()) {
        @if (!montosLocked()) {
          @if (!canAddPay()) {
            <p class="ap-ficha-hint ap-pay-covered-hint">
              Trabajo cubierto: no hay saldo pendiente; no se pueden agregar abonos adicionales.
            </p>
          }
          <div class="ap-pay-toolbar">
            <div class="ap-pay-toolbar-grid">
              <label class="ap-pay-field">
                <span class="ap-ficha-col-head">Fecha del abono: *</span>
                <input
                  class="ap-ficha-control"
                  type="date"
                  [min]="todayIso"
                  [ngModel]="newPayDate()"
                  (ngModelChange)="newPayDate.set($event)"
                  [disabled]="!canAddPay() || adding()"
                />
              </label>
              <label class="ap-pay-field">
                <span class="ap-ficha-col-head">Valor del abono *</span>
                <input
                  class="ap-ficha-control"
                  type="number"
                  min="0"
                  step="1"
                  [max]="pendingMiles()"
                  [ngModel]="newPayAmount()"
                  (ngModelChange)="newPayAmount.set(+$event || 0)"
                  [disabled]="!canAddPay() || adding()"
                />
              </label>
              <div class="ap-pay-add-wrap">
                <button
                  type="button"
                  class="ap-pay-add-btn"
                  title="Registrar abono"
                  [disabled]="!canAddPay() || adding()"
                  (click)="addPayment()"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        }

        @if (dlg.paymentsLoading()) {
          <p class="ap-ficha-caption">Cargando abonos…</p>
        } @else {
          <p class="ap-ficha-section-band ap-pay-table-band">Abonos</p>
          <div class="ap-pay-table-wrap">
            <table class="ap-pay-table">
              <thead>
                <tr>
                  <th><span class="ap-pay-col-head">Fecha</span></th>
                  <th><span class="ap-pay-col-head">Valor</span></th>
                  <th><span class="ap-pay-col-head">Estado</span></th>
                  <th>
                    <span class="ap-pay-col-head ap-pay-col-head--actions">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                @if (!dlg.payments().length) {
                  <tr>
                    <td colspan="4" class="ap-pay-empty">Aún no hay abonos registrados.</td>
                  </tr>
                } @else {
                  @for (p of dlg.payments(); track p.id) {
                    <tr>
                      <td>{{ paidOnDisplay(p) }}</td>
                      <td>{{ formatAmountTable(p.amount) }}</td>
                      <td>
                        @if (p.isVerified) {
                          <span class="ap-pay-verified">Verificado</span>
                        } @else {
                          <span class="ap-pay-unverified">Sin verificar</span>
                        }
                      </td>
                      <td class="ap-pay-actions">
                        <button
                          appIconAction="document"
                          title="Ver recibo PDF"
                          [disabled]="!receiptIdFor(p.id)"
                          (click)="openReceiptView(p.id)"
                        ></button>
                        <button
                          appIconAction="send"
                          title="Reenviar recibo"
                          [disabled]="!receiptIdFor(p.id) || resendingPayId() === p.id"
                          (click)="resendForPayment(p.id)"
                        ></button>
                        <button
                          appIconAction="edit"
                          title="Editar abono"
                          [disabled]="montosLocked()"
                          (click)="startEdit(p)"
                        ></button>
                        @if (isAdmin()) {
                          <button
                            appIconAction="check"
                            title="Verificar abono realizado"
                            [disabled]="p.isVerified || verifyingPayId() === p.id"
                            (click)="verifyPayment(p)"
                          ></button>
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (editingPaymentId(); as pid) {
            <div class="ap-pay-edit-panel">
              <p class="ap-ficha-caption">Editar abono #{{ pid }}</p>
              <div class="ap-pay-toolbar-grid ap-pay-toolbar-grid--edit">
                <label class="ap-pay-field">
                  <span class="ap-ficha-col-head">Fecha del abono</span>
                  <input
                    class="ap-ficha-control"
                    type="date"
                    [min]="todayIso"
                    [ngModel]="editPayDate()"
                    (ngModelChange)="editPayDate.set($event)"
                  />
                </label>
                <label class="ap-pay-field">
                  <span class="ap-ficha-col-head">Valor del abono</span>
                  <input
                    class="ap-ficha-control"
                    type="number"
                    min="1"
                    step="1"
                    [ngModel]="editPayAmount()"
                    (ngModelChange)="editPayAmount.set(+$event || 0)"
                  />
                </label>
                <div class="ap-pay-edit-actions">
                  <app-button variant="primary" [loading]="patching()" (clicked)="saveEdit()">
                    Guardar
                  </app-button>
                  <app-button variant="ghost" [disabled]="patching()" (clicked)="cancelEdit()">
                    Cancelar
                  </app-button>
                </div>
              </div>
            </div>
          }

          @if (viewReceiptId(); as rid) {
            <div class="ap-pay-receipt-view">
              <p class="ap-ficha-caption"><strong>Recibo PDF</strong> · #{{ rid }}</p>
              @if (pdfLoading()) {
                <p class="ap-ficha-caption">Cargando PDF…</p>
              } @else if (pdfError()) {
                <p class="form-field__error">{{ pdfError() }}</p>
              } @else {
                @if (pdfSafeUrl(); as safeUrl) {
                  <iframe
                    class="ap-pay-pdf-frame"
                    [src]="safeUrl"
                    title="Vista previa recibo"
                  ></iframe>
                }
              }
              <div class="ap-pay-receipt-actions">
                @if (pdfBlob()) {
                  <a
                    class="ap-pay-dl-link"
                    [href]="pdfBlobUrl()"
                    [download]="pdfFileName()"
                    >Descargar PDF</a
                  >
                }
                <app-button
                  variant="ghost"
                  [loading]="resendingReceipt()"
                  (clicked)="resendViewedReceipt()"
                >
                  Reenviar
                </app-button>
                <app-button variant="ghost" (clicked)="closeReceiptView()">Cerrar vista</app-button>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
})
export class AppointmentAbonosSectionComponent {
  readonly montosLocked = input(false);
  /** Total del trabajo en edición (para saldo pendiente al agregar abono). */
  readonly totalOverride = input<number | null>(null);

  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly toast = inject(ToastService);
  private readonly appStore = inject(AppStore);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly formatAmountTable = formatAmountTable;
  protected readonly paidOnDisplay = paidOnTableDisplay;
  protected readonly todayIso = todayIso();
  protected readonly isAdmin = this.appStore.isAdmin;

  readonly expanded = signal(true);
  readonly newPayDate = signal(todayIso());
  readonly newPayAmount = signal(0);
  readonly editingPaymentId = signal<number | null>(null);
  readonly editPayDate = signal(todayIso());
  readonly editPayAmount = signal(0);
  readonly viewReceiptId = signal<number | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfError = signal<string | null>(null);
  readonly pdfBlob = signal<Blob | null>(null);
  readonly pdfBlobUrl = signal<string | null>(null);
  readonly pdfSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly pdfFileName = signal(`recibo.pdf`);
  readonly adding = signal(false);
  readonly patching = signal(false);
  readonly verifyingPayId = signal<number | null>(null);
  readonly resendingPayId = signal<number | null>(null);
  readonly resendingReceipt = signal(false);

  private readonly receiptByPay = computed(() =>
    mapPaymentsToReceipts(this.dlg.payments(), this.dlg.receipts()),
  );

  readonly pendingForPay = computed(() => {
    const a = this.dlg.appointment();
    if (!a) return 0;
    const tot = this.totalOverride() ?? a.financials.total;
    const dep = a.financials.deposit;
    const credit = a.financials.credit;
    return Math.max(Math.round((tot - dep - credit) * 100) / 100, 0);
  });

  readonly pendingMiles = computed(() => copToMiles(this.pendingForPay()));

  readonly canAddPay = computed(
    () => !this.montosLocked() && this.pendingForPay() > 0.009,
  );

  receiptIdFor(paymentId: number): number | null {
    const rid = this.receiptByPay().get(paymentId);
    return rid != null && rid > 0 ? rid : null;
  }

  addPayment(): void {
    if (this.montosLocked()) {
      this.toast.warn('No puedes registrar abonos con este perfil.');
      return;
    }
    const aid = this.dlg.appointmentId();
    if (aid == null || aid <= 0) return;
    const amt = milesToCop(this.newPayAmount());
    const pend = this.pendingForPay();
    if (amt <= 0) {
      this.toast.warn('El abono debe ser mayor a cero.');
      return;
    }
    if (amt > pend + 0.01) {
      this.toast.warn('El abono no puede superar el saldo pendiente.');
      return;
    }
    this.adding.set(true);
    this.api.postPayment(aid, amt, null, this.newPayDate()).subscribe({
      next: () => {
        this.adding.set(false);
        this.newPayAmount.set(0);
        this.toast.success('Abono registrado.');
        this.refreshAfterPaymentChange();
      },
      error: (err) => {
        this.adding.set(false);
        this.toast.error(apiErrorMessage(err));
      },
    });
  }

  startEdit(p: AppointmentPayment): void {
    this.editingPaymentId.set(p.id);
    const raw = p.paidOn ?? p.createdAt ?? todayIso();
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw));
    this.editPayDate.set(m ? `${m[1]}-${m[2]}-${m[3]}` : todayIso());
    this.editPayAmount.set(copToMiles(p.amount));
  }

  cancelEdit(): void {
    this.editingPaymentId.set(null);
  }

  verifyPayment(p: AppointmentPayment): void {
    const aid = this.dlg.appointmentId();
    const uid = this.appStore.user()?.id;
    if (aid == null || aid <= 0 || !uid || p.isVerified) return;
    this.verifyingPayId.set(p.id);
    this.api.verifyPayment(aid, p.id, uid).subscribe({
      next: () => {
        this.verifyingPayId.set(null);
        this.toast.success('Abono verificado: se confirma que el abono ha sido realizado.');
        this.refreshAfterPaymentChange();
      },
      error: (err) => {
        this.verifyingPayId.set(null);
        this.toast.error(apiErrorMessage(err));
      },
    });
  }

  saveEdit(): void {
    if (this.montosLocked()) {
      this.toast.warn('No puedes editar abonos con este perfil.');
      return;
    }
    const aid = this.dlg.appointmentId();
    const pid = this.editingPaymentId();
    if (aid == null || pid == null || pid <= 0) return;
    const amt = milesToCop(this.editPayAmount());
    if (amt <= 0) {
      this.toast.warn('El abono debe ser mayor a cero.');
      return;
    }
    this.patching.set(true);
    this.api.patchPayment(aid, pid, amt, this.editPayDate()).subscribe({
      next: () => {
        this.patching.set(false);
        this.editingPaymentId.set(null);
        this.toast.success('Abono actualizado.');
        this.refreshAfterPaymentChange();
      },
      error: (err) => {
        this.patching.set(false);
        this.toast.error(apiErrorMessage(err));
      },
    });
  }

  openReceiptView(paymentId: number): void {
    const rid = this.receiptIdFor(paymentId);
    if (rid == null) return;
    this.revokePdfUrl();
    this.viewReceiptId.set(rid);
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    const aid = this.dlg.appointmentId() ?? this.dlg.appointment()?.id ?? null;
    if (aid == null || aid <= 0) {
      this.pdfLoading.set(false);
      this.pdfError.set('No se pudo identificar la cita del recibo.');
      return;
    }
    this.api.getReceiptPdf(aid, rid).subscribe({
      next: (blob) => {
        const pdf =
          blob.type === 'application/pdf'
            ? blob
            : new Blob([blob], { type: 'application/pdf' });
        this.pdfBlob.set(pdf);
        const url = URL.createObjectURL(pdf);
        this.pdfBlobUrl.set(url);
        this.pdfSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.pdfFileName.set(`recibo_${aid}_${rid}.pdf`);
        this.pdfLoading.set(false);
      },
      error: (err) => {
        this.pdfLoading.set(false);
        this.pdfError.set(apiErrorMessage(err));
      },
    });
  }

  closeReceiptView(): void {
    this.viewReceiptId.set(null);
    this.revokePdfUrl();
  }

  resendForPayment(paymentId: number): void {
    const rid = this.receiptIdFor(paymentId);
    if (rid == null) return;
    this.resendReceipt(rid, () => this.resendingPayId.set(paymentId));
  }

  resendViewedReceipt(): void {
    const rid = this.viewReceiptId();
    if (rid == null) return;
    this.resendReceipt(rid, () => this.resendingReceipt.set(true));
  }

  private resendReceipt(
    receiptId: number,
    onStart: () => void,
  ): void {
    const aid = this.dlg.appointmentId();
    if (aid == null) return;
    onStart();
    this.api.resendReceipt(aid, receiptId).subscribe({
      next: () => {
        this.resendingPayId.set(null);
        this.resendingReceipt.set(false);
        this.toast.success('Recibo reenviado.');
      },
      error: (err) => {
        this.resendingPayId.set(null);
        this.resendingReceipt.set(false);
        this.toast.error(apiErrorMessage(err));
      },
    });
  }

  private refreshAfterPaymentChange(): void {
    const id = this.dlg.appointmentId();
    if (id == null) return;
    this.dlg.loadPayments(id);
    this.dlg.loadReceipts(id);
    this.api.get(id).subscribe({
      next: (row) => {
        const appt = mapAppointment(row);
        this.dlg.patchAppointmentLocal(appt);
        this.apptStore.mergeAppointment(row);
        this.apptStore.invalidate();
      },
    });
  }

  private revokePdfUrl(): void {
    const url = this.pdfBlobUrl();
    if (url) URL.revokeObjectURL(url);
    this.pdfBlobUrl.set(null);
    this.pdfSafeUrl.set(null);
    this.pdfBlob.set(null);
    this.pdfError.set(null);
  }
}
