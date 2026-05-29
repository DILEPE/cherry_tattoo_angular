import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  bookingAmountsValidator,
  documentNumberValidator,
  minCopAmountValidator,
  mobilePhoneCo10Validator,
  optionalEmailValidator,
  trimRequiredValidator,
} from '../../../../shared/forms/form-validators';
import { BOOKING_FIELD_LABELS } from '../../../../shared/forms/form-field-labels';
import {
  collectFormValidationIssues,
  formatValidationSummaryLines,
  validateFormBeforeSubmit,
} from '../../../../shared/forms/form-submit.util';
import { FormValidationSummaryComponent } from '../../../../shared/forms/form-validation-summary/form-validation-summary.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppointmentsStore } from '../../appointments.store';
import { AppStore } from '../../../../store/app.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { CustomersApiService } from '../../services/customers-api.service';
import { PanelStaffApiService } from '../../services/panel-staff-api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import {
  BOOKING_WORK_KIND_META,
  BOOKING_WORK_KIND_ORDER,
  BookingWorkKind,
  CUSTOMER_BIRTH_PENDING_ISO,
  MIN_APPOINTMENT_TOTAL_COP,
  CustomerSnapshot,
  PanelStaffOption,
} from '../../models/booking.model';
import {
  appendAgendaSlotsMarker,
  serviceAndDetailForWorkKind,
  workKindToAssigneeRole,
  workKindToScheduleKind,
} from '../../models/booking.mapper';
import {
  appointmentsForArtistSchedule,
  availableStartSlots,
  busySlotIndices,
} from '../../models/schedule.mapper';
import { combineAppointmentDatetime, timeSlotOptions } from '../../models/appointment-slots';
import { formatCop } from '../../models/appointment.mapper';
import { BookAppointmentModalData } from '../../models/appointment-modal.model';
import { appointmentRowDate } from '../../models/calendar.mapper';

@Component({
  selector: 'app-appointment-book-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppFormFieldComponent,
    FormValidationSummaryComponent,
    FormShowErrorsDirective,
  ],
  template: `
    @if (pickedDateLabel()) {
      <p class="appt-dialog-caption">
        <strong>Fecha de la cita:</strong> {{ pickedDateLabel() }} (elegida en el calendario)
      </p>
    }

    <form [formGroup]="form" appFormShowErrors (ngSubmit)="onSubmit()" novalidate>
      <app-form-validation-summary [messages]="validationSummary()" />
      <section class="appt-book-section">
        <h4 class="appt-dialog-subtitle">Identificación del cliente</h4>
        <div class="appt-book-row">
          <app-form-field label="Tipo de documento" [control]="form.controls.docType">
            <select formControlName="docType">
              <option value="CC">CC — Cédula</option>
              <option value="TI">TI — Tarjeta de identidad</option>
              <option value="CE">CE — Extranjería</option>
              <option value="PAS">PAS — Pasaporte</option>
            </select>
          </app-form-field>
          <app-form-field label="Número de documento" [control]="form.controls.docNumber">
            <input formControlName="docNumber" autocomplete="off" />
          </app-form-field>
          <app-button
            type="button"
            variant="ghost"
            [loading]="verifyLoading()"
            (clicked)="verifyDocument()"
          >
            Verificar identificación
          </app-button>
        </div>
        @if (verifyMessage()) {
          <p [class]="verifyLevelClass()">{{ verifyMessage() }}</p>
        }
      </section>
      <div class="appt-book-row">
        <app-form-field label="Nombre" [control]="form.controls.firstName">
          <input formControlName="firstName" />
        </app-form-field>
        <app-form-field label="Apellido" [control]="form.controls.lastName">
          <input formControlName="lastName" />
        </app-form-field>
      </div>
      <div class="appt-book-row">
        <app-form-field label="Celular" [control]="form.controls.phone">
          <input formControlName="phone" />
        </app-form-field>
        <app-form-field label="Correo" [control]="form.controls.email">
          <input type="email" formControlName="email" />
        </app-form-field>
      </div>

      <div class="appt-book-row">
        <app-form-field label="Tipo de trabajo" [control]="form.controls.workKind">
          <select formControlName="workKind">
            @for (wk of workKinds; track wk) {
              <option [value]="wk">{{ workKindLabel(wk) }}</option>
            }
          </select>
        </app-form-field>
        @if (!lockedToSelf()) {
          <app-form-field label="Profesional" [control]="form.controls.staffId">
            <select formControlName="staffId">
              @for (s of staffForRole(); track s.id) {
                <option [ngValue]="s.id">{{ s.label }}</option>
              }
            </select>
          </app-form-field>
          @if (!staffForRole().length) {
            <p class="form-field__error">
              No hay {{ assigneeRoleLabel() }} activo para asignar. Revisa usuarios del panel.
            </p>
          }
        } @else {
          <p class="appt-dialog-caption">La cita quedará asignada a tu usuario del panel.</p>
        }
      </div>

      <div class="appt-book-row">
        <app-form-field label="Franjas de 30 min" [control]="form.controls.durationSlots">
          <input type="number" formControlName="durationSlots" min="1" max="16" />
        </app-form-field>
        <app-form-field label="Hora de inicio" [control]="form.controls.slot">
          <select formControlName="slot">
            @for (sl of availableSlots(); track sl) {
              <option [value]="sl">{{ sl }}</option>
            }
          </select>
        </app-form-field>
      </div>
      @if (!availableSlots().length) {
        <p class="form-field__error">No hay franjas libres ese día para esta duración.</p>
      }

      <app-form-field label="Observaciones / diseño" [control]="form.controls.observations">
        <textarea formControlName="observations" rows="2"></textarea>
      </app-form-field>

      <div class="appt-book-row">
        <app-form-field label="Valor total (COP)" [control]="form.controls.total">
          <input type="number" formControlName="total" step="10000" />
        </app-form-field>
        <app-form-field label="Abono inicial (COP)" [control]="form.controls.deposit">
          <input type="number" formControlName="deposit" step="10000" />
        </app-form-field>
      </div>

      <label class="appt-book-priority">
        <input type="checkbox" formControlName="isPriority" />
        Cita prioritaria
      </label>

      <p class="appt-dialog-caption">
        Mínimo abono y total: {{ formatCop(MIN_COP) }}
      </p>

      <div class="appt-dialog-actions">
        <app-button type="submit" variant="primary" [loading]="saving()" [disabled]="!docVerified()">
          Crear cita
        </app-button>
        <app-button variant="ghost" type="button" (clicked)="close()">Cancelar</app-button>
      </div>
    </form>
  `,
})
export class AppointmentBookDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ui = inject(UiStore);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly appStore = inject(AppStore);
  private readonly api = inject(AppointmentsApiService);
  private readonly customersApi = inject(CustomersApiService);
  private readonly staffApi = inject(PanelStaffApiService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly formatCop = formatCop;
  protected readonly MIN_COP = MIN_APPOINTMENT_TOTAL_COP;
  readonly workKinds = BOOKING_WORK_KIND_ORDER;
  readonly slotOptions = timeSlotOptions();

  readonly staffList = signal<PanelStaffOption[]>([]);
  readonly docVerified = signal(false);
  readonly verifiedDoc = signal('');
  readonly customerId = signal<number | null>(null);
  readonly customerSnapshot = signal<CustomerSnapshot | null>(null);
  readonly needNewCustomer = signal(false);
  readonly verifyMessage = signal('');
  readonly verifyLevel = signal<'success' | 'warning' | 'error' | ''>('');
  readonly saving = signal(false);
  readonly verifyLoading = signal(false);
  readonly validationSummary = signal<string[]>([]);
  private readonly formShowErrors = viewChild(FormShowErrorsDirective);
  /** Invalida computed que dependen de valores del formulario reactivo. */
  private readonly formRevision = signal(0);

  readonly form = this.fb.nonNullable.group(
    {
      docType: ['CC'],
      docNumber: ['', documentNumberValidator()],
      firstName: ['', trimRequiredValidator()],
      lastName: ['', trimRequiredValidator()],
      phone: ['', mobilePhoneCo10Validator()],
      email: ['', optionalEmailValidator()],
      workKind: ['piercing' as BookingWorkKind],
      staffId: [0, Validators.min(1)],
      durationSlots: [2, [Validators.required, Validators.min(1), Validators.max(16)]],
      slot: ['09:00', Validators.required],
      observations: [''],
      total: [MIN_APPOINTMENT_TOTAL_COP, minCopAmountValidator(MIN_APPOINTMENT_TOTAL_COP)],
      deposit: [MIN_APPOINTMENT_TOTAL_COP, minCopAmountValidator(MIN_APPOINTMENT_TOTAL_COP)],
      isPriority: [false],
    },
    { validators: [bookingAmountsValidator()] },
  );

  readonly pickedDate = computed(() => {
    const data = this.ui.activeModal()?.data as BookAppointmentModalData | undefined;
    return data?.pickedDate ?? '';
  });

  readonly pickedDateLabel = computed(() => {
    const raw = this.pickedDate();
    if (!raw) return '';
    const d = appointmentRowDate(raw);
    return d.toLocaleDateString('es-CO');
  });

  readonly lockedToSelf = computed(() => {
    this.formRevision();
    const u = this.appStore.user();
    if (!u) return false;
    const role = u.role;
    const wk = this.form.controls.workKind.value as BookingWorkKind;
    return role === workKindToAssigneeRole(wk);
  });

  readonly staffForRole = computed(() => {
    this.formRevision();
    const wk = this.form.controls.workKind.value as BookingWorkKind;
    const need = workKindToAssigneeRole(wk);
    return this.staffList().filter((s) => s.role === need);
  });

  readonly availableSlots = computed(() => {
    this.formRevision();
    const raw = this.pickedDate();
    if (!raw) return [];
    const day = appointmentRowDate(raw);
    const wk = this.form.controls.workKind.value as BookingWorkKind;
    const sched = workKindToScheduleKind(wk);
    const staffId = this.lockedToSelf()
      ? this.appStore.user()?.id ?? 0
      : Number(this.form.controls.staffId.value);
    const need = Number(this.form.controls.durationSlots.value) || 2;
    const dayRows = appointmentsForArtistSchedule(
      this.apptStore.items(),
      day,
      staffId > 0 ? staffId : null,
      sched,
    );
    const busy = busySlotIndices(dayRows, this.slotOptions);
    return availableStartSlots(this.slotOptions, need, busy);
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formRevision.update((n) => n + 1);
      const avail = this.availableSlots();
      const cur = this.form.controls.slot.value;
      if (avail.length && !avail.includes(cur)) {
        this.form.patchValue({ slot: avail[0] }, { emitEvent: false });
      }
      this.cdr.markForCheck();
    });

    effect(() => {
      if (this.ui.activeModal()?.id !== 'appointment-book') return;
      this.staffApi.listAssignable().subscribe({
        next: (list) => {
          this.staffList.set(list);
          this.syncStaffForWorkKind();
        },
      });
    });

    effect(() => {
      if (this.lockedToSelf()) {
        this.syncStaffForWorkKind();
      }
    });

    this.form.controls.workKind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wk) => {
        const kind = wk as BookingWorkKind;
        const slots = kind === 'tatuaje' ? 4 : kind === 'piercing' ? 2 : 1;
        this.form.patchValue({ durationSlots: slots }, { emitEvent: true });
        this.syncStaffForWorkKind();
        this.cdr.markForCheck();
      });

    this.form.controls.docNumber.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.docVerified()) {
          this.docVerified.set(false);
          this.verifiedDoc.set('');
          this.verifyMessage.set('Vuelve a verificar el documento si cambiaste el número.');
          this.verifyLevel.set('warning');
          this.cdr.markForCheck();
        }
      });

    effect(() => {
      const need = this.needNewCustomer();
      const emailCtrl = this.form.controls.email;
      if (need) {
        emailCtrl.setValidators([trimRequiredValidator(), Validators.email]);
      } else {
        emailCtrl.setValidators([optionalEmailValidator()]);
      }
      emailCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  workKindLabel(wk: BookingWorkKind): string {
    return BOOKING_WORK_KIND_META[wk]?.label ?? wk;
  }

  assigneeRoleLabel(): string {
    const wk = this.form.controls.workKind.value as BookingWorkKind;
    return workKindToAssigneeRole(wk) === 'tatuador' ? 'tatuador' : 'perforador';
  }

  /** Alinea el profesional con el tipo de trabajo (tatuaje → tatuador, piercing → perforador). */
  private syncStaffForWorkKind(): void {
    if (this.lockedToSelf()) {
      const id = this.appStore.user()?.id;
      if (id) this.form.patchValue({ staffId: id }, { emitEvent: false });
      return;
    }
    const filtered = this.staffForRole();
    if (!filtered.length) {
      this.form.patchValue({ staffId: 0 }, { emitEvent: false });
      this.form.controls.staffId.setErrors({ noStaff: true });
      return;
    }
    const cur = Number(this.form.controls.staffId.value);
    if (!filtered.some((s) => s.id === cur)) {
      this.form.patchValue({ staffId: filtered[0].id }, { emitEvent: false });
    }
    this.form.controls.staffId.setErrors(null);
  }

  private resolveStaffId(): number {
    if (this.lockedToSelf()) {
      return Number(this.appStore.user()?.id ?? 0);
    }
    return Number(this.form.controls.staffId.value);
  }

  verifyLevelClass(): string {
    const lvl = this.verifyLevel();
    if (lvl === 'error') return 'form-field__error';
    if (lvl === 'success') return 'appt-dialog-caption';
    return 'appt-dialog-warning';
  }

  verifyDocument(): void {
    const doc = (this.form.controls.docNumber.value ?? '').trim();
    if (doc.length < 5) {
      this.docVerified.set(false);
      this.verifyLevel.set('error');
      this.verifyMessage.set('Ingresa un número de identificación válido (mínimo 5 caracteres).');
      this.cdr.markForCheck();
      return;
    }
    this.verifyLoading.set(true);
    this.customersApi.findByDocument(doc).subscribe({
      next: (row) => {
        this.verifyLoading.set(false);
        this.verifiedDoc.set(doc);
        this.docVerified.set(true);
        if (!row) {
          this.customerId.set(null);
          this.customerSnapshot.set(null);
          this.needNewCustomer.set(true);
          this.verifyLevel.set('warning');
          this.verifyMessage.set(
            'Cliente no registrado. Completa nombre, apellido, celular y correo.',
          );
        } else {
          this.customerId.set(row.id);
          this.customerSnapshot.set(row);
          this.needNewCustomer.set(false);
          this.form.patchValue({
            docType: row.documentType || 'CC',
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phoneNumber,
            email: row.email,
          });
          this.verifyLevel.set('success');
          this.verifyMessage.set(`Cliente encontrado (id ${row.id}). Datos cargados.`);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.verifyLoading.set(false);
        this.docVerified.set(false);
        this.errors.handle(err);
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (!this.docVerified()) {
      this.toast.error('Verifica la identificación del cliente antes de crear la cita.');
      return;
    }
    const doc = this.form.controls.docNumber.value.trim();
    if (doc !== this.verifiedDoc()) {
      this.toast.error('Vuelve a verificar el documento; el número cambió.');
      return;
    }
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: BOOKING_FIELD_LABELS,
        onInvalid: () => this.formShowErrors()?.activate(),
      })
    ) {
      this.validationSummary.set(
        formatValidationSummaryLines(
          collectFormValidationIssues(this.form, BOOKING_FIELD_LABELS),
        ),
      );
      this.cdr.markForCheck();
      return;
    }
    this.validationSummary.set([]);
    this.formShowErrors()?.reset();

    const raw = this.pickedDate();
    const picked = appointmentRowDate(raw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (picked < today) {
      this.toast.error('La fecha no puede ser anterior a hoy.');
      return;
    }

    const avail = this.availableSlots();
    const slot = this.form.controls.slot.value;
    if (!avail.length || !avail.includes(slot)) {
      this.toast.error('La franja elegida ya no está libre.');
      return;
    }

    const total = Math.round(Number(this.form.controls.total.value));
    const deposit = Math.round(Number(this.form.controls.deposit.value));

    const wk = this.form.controls.workKind.value as BookingWorkKind;
    const staffId = this.resolveStaffId();
    const allowed = this.staffForRole();
    if (!staffId || !allowed.some((s) => s.id === staffId)) {
      const rol = this.assigneeRoleLabel();
      this.toast.error(
        allowed.length
          ? `Elige un ${rol} en el campo Profesional (debe coincidir con el tipo de trabajo).`
          : `No hay ningún ${rol} activo para asignar esta cita.`,
      );
      return;
    }

    const obs = this.form.controls.observations.value.trim();
    const { service, detail } = serviceAndDetailForWorkKind(wk, obs);
    const dur = Number(this.form.controls.durationSlots.value);
    const detailApi = appendAgendaSlotsMarker(detail, dur);
    const dt = combineAppointmentDatetime(picked, slot);
    const fn = this.form.controls.firstName.value.trim();
    const ln = this.form.controls.lastName.value.trim();
    const phone = this.form.controls.phone.value.trim();
    const email = this.form.controls.email.value.trim();

    const payload: Record<string, unknown> = {
      name: `${fn} ${ln}`.trim(),
      phone,
      service,
      date: dt,
      detail: detailApi,
      deposit,
      total_amount: total,
      pending_balance: Math.max(Math.round((total - deposit) * 100) / 100, 0),
      is_priority: this.form.controls.isPriority.value,
      assigned_panel_user_id: staffId,
    };

    if (this.needNewCustomer()) {
      payload['customer'] = {
        first_name: fn,
        last_name: ln,
        birth_date: CUSTOMER_BIRTH_PENDING_ISO,
        document_type: this.form.controls.docType.value,
        document_number: doc,
        email: email || null,
        phone_number: phone,
        is_minor: false,
      };
    } else {
      const cid = this.customerId();
      if (!cid) {
        this.toast.error('Verifica la identificación del cliente.');
        return;
      }
      payload['customer_id'] = cid;
      const snap = this.customerSnapshot();
      if (snap) {
        payload['customer'] = {
          first_name: fn,
          last_name: ln,
          birth_date: CUSTOMER_BIRTH_PENDING_ISO,
          document_type: this.form.controls.docType.value,
          document_number: doc,
          document_issue_date: null,
          email: email || null,
          phone_number: phone,
          address: null,
          is_minor: false,
        };
      }
    }

    this.saving.set(true);
    this.api.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        const msg =
          deposit > 0
            ? 'Cita creada. Si hubo abono, revisa Recibos para el PDF.'
            : 'Cita creada correctamente.';
        this.toast.success(msg);
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
