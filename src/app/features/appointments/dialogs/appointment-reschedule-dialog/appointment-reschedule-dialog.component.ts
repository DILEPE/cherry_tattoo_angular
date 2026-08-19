import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { dateNotBeforeTodayValidator } from '../../../../shared/forms/form-validators';
import { RESCHEDULE_FIELD_LABELS } from '../../../../shared/forms/form-field-labels';
import { validateFormBeforeSubmit } from '../../../../shared/forms/form-submit.util';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import {
  appointmentBlockEndSlot,
  combineAppointmentDatetime,
  durationSlotsFromStartEnd,
  formatDatetimeCompactEs,
  parseExistingAppointmentSlot,
  timeSlotOptions,
} from '../../models/appointment-slots';
import { durationSlotsForRow } from '../../models/agenda-slots.mapper';
import {
  appendAgendaSlotsMarker,
  appointmentToScheduleKind,
  stripAgendaSlotsMarker,
} from '../../models/booking.mapper';
import {
  appointmentsForArtistSchedule,
  availableEndTimes,
  availableStartTimes,
  busySlotIndices,
  preferredEndTime,
} from '../../models/schedule.mapper';
import { reprogramDisabledForRow } from '../../models/appointment-policy';
import { resolveAppointmentModalId } from '../appointment-modal.util';

@Component({
  selector: 'app-appointment-reschedule-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppButtonComponent, AppFormFieldComponent, FormShowErrorsDirective],
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
      <form [formGroup]="form" appFormShowErrors (ngSubmit)="onSubmit()" novalidate>
        <app-form-field label="Detalle actualizado (opcional)" [control]="form.controls.detail">
          <textarea formControlName="detail" rows="3"></textarea>
        </app-form-field>
        <app-form-field label="Nueva fecha" [control]="form.controls.date">
          <input type="date" formControlName="date" [min]="minDateStr()" />
        </app-form-field>
        <div class="appt-book-row">
          <app-form-field label="Hora de inicio" [control]="form.controls.slot">
            <select formControlName="slot">
              @for (sl of availableStartChoices(); track sl) {
                <option [value]="sl">{{ sl }}</option>
              }
            </select>
          </app-form-field>
          <app-form-field label="Hora de fin" [control]="form.controls.endSlot">
            <select formControlName="endSlot">
              @for (sl of availableEndChoices(); track sl) {
                <option [value]="sl">{{ sl }}</option>
              }
            </select>
          </app-form-field>
        </div>
        @if (!availableStartChoices().length) {
          <p class="form-field__error">
            No hay horario libre ese día para el artista de la cita.
          </p>
        }
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formShowErrors = viewChild(FormShowErrorsDirective);

  readonly slotOptions = timeSlotOptions();
  readonly saving = signal(false);
  readonly blocked = signal(false);
  private readonly formRevision = signal(0);
  private preferredDurSlots = 2;

  form = this.fb.nonNullable.group({
    detail: ['', Validators.maxLength(2000)],
    date: ['', [Validators.required, dateNotBeforeTodayValidator()]],
    slot: ['09:00', Validators.required],
    endSlot: ['10:00', Validators.required],
  });

  private busyForForm(): Set<number> {
    const a = this.dlg.appointment();
    const dateStr = this.form.controls.date.value;
    if (!a || !dateStr) return new Set();
    const day = new Date(dateStr + 'T12:00:00');
    const dayRows = appointmentsForArtistSchedule(
      this.apptStore.items(),
      day,
      a.assignedPanelUserId ?? null,
      appointmentToScheduleKind(a),
      a.id,
    );
    return busySlotIndices(dayRows, this.slotOptions);
  }

  readonly availableStartChoices = computed(() => {
    this.formRevision();
    return availableStartTimes(this.slotOptions, this.busyForForm(), 1);
  });

  readonly availableEndChoices = computed(() => {
    this.formRevision();
    const start = this.form.controls.slot.value || '09:00';
    return availableEndTimes(start, this.slotOptions, this.busyForForm());
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
    const dur = durationSlotsForRow(a);
    this.preferredDurSlots = dur;
    const end = appointmentBlockEndSlot(slot, dur, this.slotOptions);
    this.form.patchValue({
      detail: stripAgendaSlotsMarker(a.detail),
      date: this.toInputDate(useDate),
      slot: this.slotOptions.includes(slot) ? slot : this.slotOptions[0],
      endSlot: end,
    });
    this.formRevision.update((n) => n + 1);
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formRevision.update((n) => n + 1);
      const starts = this.availableStartChoices();
      const curStart = this.form.controls.slot.value;
      if (starts.length && !starts.includes(curStart)) {
        this.form.patchValue({ slot: starts[0] }, { emitEvent: false });
      }
      const start = this.form.controls.slot.value || starts[0] || '09:00';
      const ends = availableEndTimes(start, this.slotOptions, this.busyForForm());
      const preferred = preferredEndTime(
        start,
        this.preferredDurSlots,
        ends,
        this.slotOptions,
      );
      const curEnd = this.form.controls.endSlot.value;
      if (ends.length && !ends.includes(curEnd)) {
        this.form.patchValue({ endSlot: preferred }, { emitEvent: false });
      }
      this.cdr.markForCheck();
    });
  }

  minDateStr(): string {
    return this.toInputDate(new Date());
  }

  onSubmit(): void {
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: RESCHEDULE_FIELD_LABELS,
        onInvalid: () => this.formShowErrors()?.activate(),
      })
    ) {
      return;
    }
    const a = this.dlg.appointment();
    if (!a) return;
    const { detail, date, slot, endSlot } = this.form.getRawValue();
    const starts = this.availableStartChoices();
    const ends = this.availableEndChoices();
    if (!starts.length || !starts.includes(slot) || !ends.length || !ends.includes(endSlot)) {
      this.toast.error('El horario elegido ya no está libre para este profesional.');
      return;
    }
    const d = new Date(date + 'T12:00:00');
    const dt = combineAppointmentDatetime(d, slot);
    const dur = durationSlotsFromStartEnd(slot, endSlot, this.slotOptions);
    const detailApi = appendAgendaSlotsMarker(
      detail.trim() || stripAgendaSlotsMarker(a.detail),
      dur,
    );
    this.saving.set(true);
    this.api.patchReschedule(a.id, dt, detailApi).subscribe({
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
