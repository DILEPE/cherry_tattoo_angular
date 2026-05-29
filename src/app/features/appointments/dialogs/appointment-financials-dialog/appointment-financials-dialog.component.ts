import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { formatCop } from '../../models/appointment.mapper';
import { canEditFinancials } from '../../models/appointment-policy';
import { resolveAppointmentModalId } from '../appointment-modal.util';

@Component({
  selector: 'app-appointment-financials-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppButtonComponent, AppFormFieldComponent],
  template: `
    @if (dlg.appointment(); as a) {
      @if (!canEditFinancials(a)) {
        <p class="form-field__error">Solo puedes editar montos en estados Agendada o Reprogramada.</p>
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      } @else {
        <p class="appt-dialog-caption">
          Cita #{{ a.id }} · {{ a.statusLabel }} · Artista: <strong>{{ a.assignedLabel }}</strong>
        </p>

        <h4 class="appt-dialog-subtitle">Historial de abonos</h4>
        @if (dlg.paymentsLoading()) {
          <p>Cargando abonos…</p>
        } @else if (!dlg.payments().length) {
          <p class="empty-state">Aún no hay abonos registrados.</p>
        } @else {
          <ul class="appt-payments-list">
            @for (p of dlg.payments(); track p.id) {
              <li>
                {{ (p.createdAt ?? '').slice(0, 19) }} · {{ formatCop(p.amount) }} ·
                {{ p.note || 'Sin nota' }}
              </li>
            }
          </ul>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <app-form-field label="Valor total del trabajo (COP)" [control]="form.controls.total">
            <input type="number" formControlName="total" min="0" step="10000" />
          </app-form-field>
          <div class="appt-fin-summary appt-fin-summary--compact">
            <div class="appt-fin-summary__item">
              <span class="appt-fin-summary__label">Abonado</span>
              <strong>{{ a.financials.depositFmt }}</strong>
            </div>
            <div class="appt-fin-summary__item" [class.appt-fin-summary__item--pending]="pendingCalc() > 0">
              <span class="appt-fin-summary__label">Pendiente (calc.)</span>
              <strong>{{ formatCop(pendingCalc()) }}</strong>
            </div>
            @if (a.financials.credit > 0) {
              <div class="appt-fin-summary__item">
                <span class="appt-fin-summary__label">Saldo a favor</span>
                <strong>{{ a.financials.creditFmt }}</strong>
              </div>
            }
          </div>

          @if (canAddExtra()) {
            <app-form-field label="Agregar abono adicional (COP)" [control]="form.controls.extra">
              <input type="number" formControlName="extra" min="0" [max]="pendingCalc()" step="10000" />
            </app-form-field>
            <app-form-field label="Nota del abono (opcional)" [control]="form.controls.note">
              <input type="text" formControlName="note" placeholder="Ej: abono en efectivo" />
            </app-form-field>
          } @else {
            <p class="empty-state">Trabajo cubierto: no hay saldo pendiente para otro abono.</p>
          }

          @if (saveError()) {
            <p class="form-field__error">{{ saveError() }}</p>
          }

          <div class="appt-dialog-actions">
            <app-button type="submit" variant="primary" [loading]="saving()">Guardar</app-button>
            <app-button variant="ghost" type="button" (clicked)="close()">Cancelar</app-button>
          </div>
        </form>
      }
    } @else if (dlg.loading()) {
      <p>Cargando…</p>
    }
  `,
})
export class AppointmentFinancialsDialogComponent {
  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly ui = inject(UiStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly fb = inject(FormBuilder);

  protected readonly formatCop = formatCop;
  protected readonly canEditFinancials = canEditFinancials;

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.nonNullable.group({
    total: [0, [Validators.required, Validators.min(0)]],
    extra: [0, [Validators.min(0)]],
    note: [''],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  pendingCalc(): number {
    const a = this.dlg.appointment();
    if (!a) return 0;
    const total = Math.max(Number(this.form.controls.total.value ?? 0), a.financials.deposit);
    const deposit = a.financials.deposit;
    const credit = a.financials.credit;
    return Math.max(Math.round((total - deposit - credit) * 100) / 100, 0);
  }

  private readonly _load = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'appointment-financials') return;
    this.dlg.loadAppointment(id);
    this.dlg.loadPayments(id);
    const a = this.dlg.appointment();
    if (a) {
      this.form.patchValue({ total: a.financials.total, extra: 0, note: '' });
    }
  });

  private readonly _syncTotal = effect(() => {
    const a = this.dlg.appointment();
    if (a && this.ui.activeModal()?.id === 'appointment-financials') {
      this.form.patchValue({ total: a.financials.total }, { emitEvent: false });
    }
  });

  canAddExtra(): boolean {
    return this.pendingCalc() > 0.009;
  }

  onSubmit(): void {
    const a = this.dlg.appointment();
    if (!a || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const total = Math.max(Number(this.form.controls.total.value), a.financials.deposit);
    const deposit = a.financials.deposit;
    const credit = a.financials.credit;
    const pending = Math.max(Math.round((total - deposit - credit) * 100) / 100, 0);
    const extra = Number(this.form.controls.extra.value);

    if (deposit > total) {
      this.saveError.set('El abonado acumulado no puede ser mayor al valor total.');
      return;
    }
    if (extra > 0 && !this.canAddExtra()) {
      this.saveError.set('No hay saldo pendiente; no puedes registrar otro abono.');
      return;
    }
    if (extra > pending + 0.01) {
      this.saveError.set(
        `El abono adicional (${formatCop(extra)}) supera el saldo pendiente (${formatCop(pending)}).`,
      );
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.api.patchFinancials(a.id, total, deposit, pending).subscribe({
      next: () => {
        if (extra > 0) {
          const note = this.form.controls.note.value.trim() || null;
          this.api.postPayment(a.id, extra, note).subscribe({
            next: () => this.finishSave(extra > 0),
            error: (err) => {
              this.saving.set(false);
              this.errors.handle(err, 'No se pudo registrar el abono adicional');
            },
          });
        } else {
          this.finishSave(false);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  private finishSave(hadExtra: boolean): void {
    this.saving.set(false);
    this.toast.success(
      hadExtra
        ? 'Montos y abonos actualizados. Revisa Recibos para el nuevo PDF.'
        : 'Montos actualizados.',
    );
    this.apptStore.invalidate();
    this.close();
  }

  close(): void {
    this.ui.closeModal();
  }
}
