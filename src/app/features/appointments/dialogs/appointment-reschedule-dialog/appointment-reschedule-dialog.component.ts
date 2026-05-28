import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import {
  combineAppointmentDatetime,
  formatDatetimeCompactEs,
  parseExistingAppointmentSlot,
  timeSlotOptions,
} from '../../models/appointment-slots';
import { reprogramDisabledForRow } from '../../models/appointment-policy';
import { resolveAppointmentModalId } from '../appointment-modal.util';
@Component({
  selector: 'app-appointment-reschedule-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppButtonComponent, AppFormFieldComponent],
  template: `
    @if (blocked()) {
      <p class="empty-state">
        No se puede reprogramar: debe estar Agendada o Reprogramada, sin contrato firmado.
      </p>
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    } @else {
      <p class="appt-dialog-caption">
        Cita #{{ dlg.appointment()?.id }} · {{ dlg.appointment()?.customerName }} · Artista:
        <strong>{{ dlg.appointment()?.assignedLabel }}</strong>
      </p>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <app-form-field label="Detalle actualizado (opcional)" [control]="form.controls.detail">
          <textarea formControlName="detail" rows="3"></textarea>
        </app-form-field>
        <app-form-field label="Nueva fecha" [control]="form.controls.date">
          <input type="date" formControlName="date" [min]="minDateStr()" />
        </app-form-field>
        <app-form-field label="Nueva franja horaria" [control]="form.controls.slot">
          <select formControlName="slot">
            @for (sl of slotOptions; track sl) {
              <option [value]="sl">{{ sl }}</option>
            }
          </select>
        </app-form-field>
        <div class="appt-dialog-actions">
          <app-button type="submit" variant="primary" [loading]="saving()">
            Guardar reprogramación
          </app-button>
          <app-button variant="ghost" type="button" (clicked)="close()">Cancelar</app-button>
        </div>
      </form>
    }
  `,
})
export class AppointmentRescheduleDialogComponent {
  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly ui = inject(UiStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly fb = inject(FormBuilder);

  readonly slotOptions = timeSlotOptions();
  readonly saving = signal(false);
  readonly blocked = signal(false);

  form = this.fb.nonNullable.group({
    detail: [''],
    date: ['', Validators.required],
    slot: ['09:00', Validators.required],
  });

  private readonly _init = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'appointment-reschedule') return;
    if (!this.dlg.appointment() || this.dlg.appointmentId() !== id) {
      this.dlg.loadAppointment(id);
    }
    const a = this.dlg.appointment();
    if (!a) return;
    if (reprogramDisabledForRow(a)) {
      this.blocked.set(true);
      return;
    }
    this.blocked.set(false);
    const { date, slot } = parseExistingAppointmentSlot(a.appointmentDateRaw ?? a.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const useDate = date >= today ? date : today;
    this.form.patchValue({
      detail: a.detail,
      date: this.toInputDate(useDate),
      slot: this.slotOptions.includes(slot) ? slot : this.slotOptions[0],
    });
  });

  minDateStr(): string {
    return this.toInputDate(new Date());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const a = this.dlg.appointment();
    if (!a) return;
    const { detail, date, slot } = this.form.getRawValue();
    const d = new Date(date + 'T12:00:00');
    const dt = combineAppointmentDatetime(d, slot);
    this.saving.set(true);
    this.api.patchReschedule(a.id, dt, detail.trim() || null).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          `Cita reprogramada · #${a.id} · ${formatDatetimeCompactEs(dt)}`,
        );
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

  private toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
