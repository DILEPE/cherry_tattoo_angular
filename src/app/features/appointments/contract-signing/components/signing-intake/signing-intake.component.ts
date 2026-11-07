import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { StoresApiService } from '../../../../../core/services/stores-api.service';
import { StoreOption } from '../../../../../core/models/store.model';
import { documentNumberValidator } from '../../../../../shared/forms/form-validators';
import { AppButtonComponent } from '../../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../../shared/ui/form-field/app-form-field.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../../core/services/error.service';
import { CustomerFormComponent } from '../../../../customers/components/customer-form/customer-form.component';
import {
  CUSTOMER_BIRTH_PENDING_ISO,
  Customer,
  CustomerWritePayload,
  DocumentType,
} from '../../../../customers/models/customer.model';
import { CustomersApiService } from '../../../../customers/services/customers-api.service';
import { AppointmentsApiService } from '../../../services/appointments-api.service';
import { PanelStaffApiService } from '../../../services/panel-staff-api.service';
import { Appointment } from '../../../models/appointment.model';
import {
  formatCop,
  formatThousandsCopInput,
  mapAppointment,
  parseThousandsCopInput,
} from '../../../models/appointment.mapper';
import { formatSearchHitDatetime } from '../../../models/appointment-search.model';
import {
  assigneeRoleNoun,
  appendAgendaSlotsMarker,
  bookingWorkKindRequiresContract,
  inferWorkKindFromAppointment,
  serviceAndDetailForWorkKind,
  workKindToAssigneeRole,
} from '../../../models/booking.mapper';
import {
  BOOKING_WORK_KIND_META,
  BookingWorkKind,
  PanelStaffOption,
  minTotalCopForWorkKind,
} from '../../../models/booking.model';
import {
  detailWithReceiptDesign,
  readKioskDraftId,
  signingAgendaDateTime,
  writeKioskDraftId,
} from '../../models/kiosk-draft';
import { appointmentPaymentReadyForSignature } from '../../models/contract-payment.util';

type IntakeStep = 'document' | 'existing' | 'service' | 'customer' | 'schedule' | 'done';

const DOC_TYPES: DocumentType[] = ['CC', 'TI', 'CE', 'PAS'];
const UNPAID_MESSAGE =
  'Esta cita no ha sido cancelada en su totalidad. El valor del trabajo no está completo. Verifica con el vendedor.';

function isAvailableAppointment(appt: Appointment): boolean {
  if (appt.status !== 'agendada' && appt.status !== 'reprogramada') return false;
  if (!appt.appointmentDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(appt.appointmentDate);
  day.setHours(0, 0, 0, 0);
  return day.getTime() >= today.getTime();
}

function customerFromPayload(base: Customer, payload: CustomerWritePayload): Customer {
  const birth = payload.birth_date;
  const pending = !birth || birth === CUSTOMER_BIRTH_PENDING_ISO;
  return {
    ...base,
    firstName: payload.first_name,
    lastName: payload.last_name,
    birthDate: birth,
    birthDatePending: pending,
    documentType: payload.document_type,
    documentNumber: payload.document_number,
    documentIssueDate: payload.document_issue_date ?? null,
    email: payload.email,
    phoneNumber: payload.phone_number,
    address: payload.address ?? null,
    nationality: payload.nationality ?? null,
    profession: payload.profession ?? null,
    socialMedia: payload.social_media ?? null,
    emergencyContactName: payload.emergency_contact_name ?? null,
    emergencyContactPhone: payload.emergency_contact_phone ?? null,
    isMinor: payload.is_minor,
    guardianName: payload.guardian_name ?? null,
    guardianDocumentType: payload.guardian_document_type ?? null,
    guardianDocumentNumber: payload.guardian_document_number ?? null,
    guardianDocumentIssueDate: payload.guardian_document_issue_date ?? null,
  };
}

function blankCustomer(documentType: DocumentType, documentNumber: string): Customer {
  return {
    id: 0,
    firstName: '',
    lastName: '',
    birthDate: '',
    birthDatePending: true,
    documentType,
    documentNumber,
    documentIssueDate: null,
    email: '',
    phoneNumber: '',
    address: null,
    nationality: null,
    profession: null,
    socialMedia: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    isMinor: false,
    guardianName: null,
    guardianDocumentType: null,
    guardianDocumentNumber: null,
    guardianDocumentIssueDate: null,
    createdAt: null,
    updatedAt: null,
  };
}

@Component({
  selector: 'app-signing-intake',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppFormFieldComponent,
    CustomerFormComponent,
  ],
  template: `
    <div class="login-page panel-fade-in">
      <img
        class="login-page__logo"
        src="/assets/rock-city-logo.png"
        alt="Rock City"
        width="72"
        height="72"
      />
      <div
        class="login-card"
        [class.intake-wide]="step() !== 'document' && step() !== 'done'"
        [class.intake-done]="step() === 'done'"
        [class.login-card--busy]="loading()"
      >
        @if (loading()) {
          <p class="intake-note" aria-live="polite">Buscando tu cita…</p>
        }

        @switch (step()) {
          @case ('document') {
            <h1>Firmar contrato</h1>
            <p>Ingresa tu tipo y número de documento. Si tienes una cita, la usamos; si no, la agendamos aquí.</p>
            <form [formGroup]="docForm" (ngSubmit)="lookup()" novalidate>
              <app-form-field label="Tipo de documento" [control]="docForm.controls.documentType">
                <select formControlName="documentType">
                  @for (t of docTypes; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
              </app-form-field>
              <app-form-field label="Número de documento" [control]="docForm.controls.documentNumber">
                <input formControlName="documentNumber" inputmode="numeric" autocomplete="off" />
              </app-form-field>
              <app-button type="submit" variant="primary" [loading]="loading()">Continuar</app-button>
            </form>
          }

          @case ('existing') {
            <h1>Tu cita</h1>
            @if (appointments().length > 1) {
              <p class="intake-note">Tienes más de una cita pendiente. Elige cuál vas a usar.</p>
              <div class="intake-choices">
                @for (a of appointments(); track a.id) {
                  <button
                    type="button"
                    class="btn btn--ghost"
                    [class.intake-choice--on]="a.id === selectedId()"
                    (click)="selectedId.set(a.id)"
                  >
                    {{ whenLabel(a) }} · {{ workLabel(a) }}
                  </button>
                }
              </div>
            }
            @if (selectedAppointment(); as a) {
              <dl class="intake-summary">
                <div><dt>Cliente</dt><dd>{{ a.customerName }}</dd></div>
                <div><dt>Fecha</dt><dd>{{ whenLabel(a) }}</dd></div>
                <div><dt>Servicio</dt><dd>{{ workLabel(a) }}</dd></div>
                <div><dt>Profesional</dt><dd>{{ a.assignedLabel }}</dd></div>
                <div><dt>Valor del trabajo</dt><dd>{{ a.financials.totalFmt }}</dd></div>
                <div><dt>Saldo pendiente</dt><dd>{{ a.financials.pendingFmt }}</dd></div>
                <div><dt>Estado</dt><dd>{{ a.statusLabel }}</dd></div>
              </dl>
              @if (existingNotice(); as note) {
                <p [class.intake-alert]="note.kind === 'alert'" [class.intake-note]="note.kind === 'info'">
                  {{ note.text }}
                </p>
                <div class="intake-actions">
                  <app-button variant="ghost" (clicked)="restart()">Otro documento</app-button>
                  <app-button variant="ghost" (clicked)="startAnotherAppointment()">
                    Agendar otra cita
                  </app-button>
                  @if (note.canSign) {
                    <app-button variant="primary" (clicked)="continueExisting()">
                      Continuar a firmar
                    </app-button>
                  }
                </div>
              }
            }
          }

          @case ('service') {
            <h1>Tipo de trabajo</h1>
            @if (customer(); as c) {
              @if (c.id > 0) {
                <p class="intake-note">
                  Encontramos tu ficha{{ c.firstName ? ', ' + c.firstName : '' }}.
                  @if (appointments().length) {
                    Puedes agendar otra cita hoy.
                  } @else {
                    No tienes una cita pendiente: vamos a agendarla.
                  }
                </p>
              }
            } @else {
              <p class="intake-note">No hay una ficha con ese documento. Elige el trabajo y luego completa tus datos.</p>
            }
            <p>¿Qué trabajo se va a hacer?</p>
            <div class="intake-choices">
              <button type="button" class="btn btn--ghost" [class.intake-choice--on]="family() === 'tatuaje'" (click)="family.set('tatuaje')">
                Tatuaje
              </button>
              <button type="button" class="btn btn--ghost" [class.intake-choice--on]="family() === 'piercing'" (click)="family.set('piercing')">
                Piercing
              </button>
            </div>
            @if (family() === 'piercing') {
              <p>¿Qué servicio de piercing?</p>
              <div class="intake-choices">
                <button type="button" class="btn btn--ghost" [class.intake-choice--on]="piercingKind() === 'piercing'" (click)="piercingKind.set('piercing')">
                  Colocación
                </button>
                <button type="button" class="btn btn--ghost" [class.intake-choice--on]="piercingKind() === 'limpieza_piercing'" (click)="piercingKind.set('limpieza_piercing')">
                  Limpieza
                </button>
                <button type="button" class="btn btn--ghost" [class.intake-choice--on]="piercingKind() === 'cambio_piercing'" (click)="piercingKind.set('cambio_piercing')">
                  Cambio
                </button>
              </div>
            }
            <div class="intake-actions">
              <app-button variant="ghost" (clicked)="restart()">Volver</app-button>
              <app-button variant="primary" [disabled]="!workKind()" (clicked)="goToCustomer()">
                Continuar
              </app-button>
            </div>
          }

          @case ('customer') {
            <h1>Datos del cliente</h1>
            @if (customer(); as c) {
              @if (c.id > 0) {
                <p class="intake-note">Revisa tu ficha y completa lo que falte. El documento no cambia.</p>
              } @else {
                <p class="intake-note">Completa tus datos para agendar la cita.</p>
              }
              <app-customer-form [initial]="c" (submitted)="onCustomerSaved($event)">
                <div actions class="intake-actions">
                  <app-button type="button" variant="ghost" (clicked)="step.set('service')">Volver</app-button>
                  <app-button type="submit" variant="primary">Continuar</app-button>
                </div>
              </app-customer-form>
            }
          }

          @case ('schedule') {
            <h1>Tienda y {{ assigneeNoun() }}</h1>
            @if (workKind(); as kind) {
              <p><strong>{{ workKindLabel(kind) }}</strong></p>
              @if (requiresContract()) {
                <p class="intake-note">
                  Después seguirás con el cuestionario y el contrato. La pregunta de cuánto costó el servicio
                  será el valor total del trabajo.
                </p>
              } @else {
                <label class="intake-field">
                  Valor del trabajo
                  <input
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    [value]="priceDisplay()"
                    (input)="onPriceInput($event)"
                  />
                </label>
              }
            }
            <label class="intake-field">
              Tienda
              <select [value]="storeId()" (change)="onStoreChange($event)">
                <option value="0">Selecciona la tienda…</option>
                @for (s of stores(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            </label>
            <label class="intake-field">
              {{ assigneeTitle() }}
              <select [value]="staffId()" (change)="onStaffChange($event)" [disabled]="storeId() <= 0">
                <option value="0">Selecciona…</option>
                @for (p of staffForStore(); track p.id) {
                  <option [value]="p.id">{{ p.label }}</option>
                }
              </select>
            </label>
            @if (storeId() > 0 && !staffForStore().length) {
              <p class="intake-alert">No hay un {{ assigneeNoun() }} activo en esta tienda.</p>
            }
            <div class="intake-actions" [class.intake-actions--confirm]="!requiresContract()">
              <app-button variant="ghost" (clicked)="step.set('customer')">Volver</app-button>
              <app-button variant="primary" [loading]="saving()" (clicked)="confirmSchedule()">
                Confirmar cita
              </app-button>
            </div>
          }

          @case ('done') {
            <div class="intake-done__mark" aria-hidden="true">✓</div>
            <h1>Cita agendada</h1>
            <app-button variant="primary" (clicked)="restart()">Listo</app-button>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .intake-wide {
      max-width: 48rem;
    }

    .intake-done {
      max-width: 15.5rem;
      padding: 1.35rem 1.15rem 1.1rem;
      text-align: center;
    }

    .intake-done h1 {
      margin: 0 0 0.9rem;
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .intake-done__mark {
      width: 2.15rem;
      height: 2.15rem;
      margin: 0 auto 0.65rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #eef1f4;
      color: #3d4652;
      font-size: 1rem;
      font-weight: 700;
      line-height: 1;
    }

    .intake-done app-button {
      display: inline-block;
      width: auto;
    }

    .intake-done ::ng-deep .btn {
      width: auto;
      min-width: 6.5rem;
      padding: 0.4rem 1.15rem;
      border-radius: 999px;
      font-size: 0.8125rem;
    }

    .intake-note {
      margin: 0 0 1rem;
      color: #3f4754;
    }

    .intake-alert {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid #f0c2c2;
      background: #fff4f4;
      color: #8a1f1f;
    }

    .intake-choices {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .intake-choices .btn {
      width: auto;
    }

    .intake-choice--on {
      outline: 2px solid var(--accent, #111);
      outline-offset: 1px;
    }

    .intake-summary {
      display: grid;
      gap: 0.4rem;
      margin: 0 0 1rem;
    }

    .intake-summary div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .intake-summary dt {
      font-weight: 600;
    }

    .intake-summary dd {
      margin: 0;
      text-align: right;
    }

    .intake-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .intake-actions app-button {
      width: auto;
    }

    .intake-actions--confirm app-button:last-child ::ng-deep .btn {
      padding: 0.75rem 1.45rem;
      font-size: 1rem;
    }

    .intake-field {
      display: grid;
      gap: 0.35rem;
      margin-bottom: 0.85rem;
      font-weight: 600;
    }

    .intake-field input,
    .intake-field select {
      font-weight: 400;
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }

    .intake-hint {
      font-weight: 400;
      font-size: 0.8125rem;
      color: #3f4754;
    }
  `,
})
export class SigningIntakeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly customersApi = inject(CustomersApiService);
  private readonly apptApi = inject(AppointmentsApiService);
  private readonly storesApi = inject(StoresApiService);
  private readonly staffApi = inject(PanelStaffApiService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);

  protected readonly docTypes = DOC_TYPES;

  readonly step = signal<IntakeStep>('document');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly customer = signal<Customer | null>(null);
  readonly appointments = signal<Appointment[]>([]);
  readonly selectedId = signal(0);
  readonly family = signal<'tatuaje' | 'piercing' | null>(null);
  readonly piercingKind = signal<BookingWorkKind | null>(null);
  readonly customerPayload = signal<CustomerWritePayload | null>(null);
  readonly stores = signal<StoreOption[]>([]);
  readonly staff = signal<PanelStaffOption[]>([]);
  readonly storeId = signal(0);
  readonly staffId = signal(0);
  readonly priceCop = signal<number | null>(null);
  readonly priceDisplay = signal('');

  readonly docForm = this.fb.nonNullable.group({
    documentType: ['CC' as DocumentType, Validators.required],
    documentNumber: ['', documentNumberValidator()],
  });

  readonly workKind = computed<BookingWorkKind | null>(() => {
    const family = this.family();
    if (family === 'tatuaje') return 'tatuaje';
    if (family === 'piercing') return this.piercingKind();
    return null;
  });

  readonly requiresContract = computed(() => {
    const kind = this.workKind();
    return !!kind && bookingWorkKindRequiresContract(kind);
  });

  readonly selectedAppointment = computed(() => {
    const rows = this.appointments();
    const id = this.selectedId();
    return rows.find((a) => a.id === id) ?? rows[0] ?? null;
  });

  readonly staffForStore = computed(() => {
    const kind = this.workKind();
    const storeId = this.storeId();
    if (!kind || storeId <= 0) return [];
    const role = workKindToAssigneeRole(kind);
    return this.staff().filter((p) => p.role === role && p.storeId === storeId);
  });

  lookup(): void {
    if (this.docForm.invalid) {
      this.docForm.markAllAsTouched();
      this.toast.warn('Indica el tipo y el número de documento.');
      return;
    }
    const { documentType, documentNumber } = this.docForm.getRawValue();
    const doc = documentNumber.trim();
    this.loading.set(true);
    this.customersApi
      .list({ limit: 10, offset: 0, documentNumber: doc })
      .pipe(
        switchMap((res) => {
          const row =
            res.items.find(
              (i) => i.documentNumber.trim() === doc && i.documentType === documentType,
            ) ?? null;
          const customer$ = row ? this.customersApi.getById(row.id) : of(null);
          return forkJoin({
            customer: customer$,
            search: this.apptApi.search({
              field: 'document',
              q: doc,
              limit: 20,
              offset: 0,
            }),
          });
        }),
        switchMap(({ customer, search }) => {
          const ids = (search.items ?? []).map((i) => i.id).filter((id) => id > 0);
          if (!customer || customer.id <= 0 || !ids.length) {
            return of({ customer, appointments: [] as Appointment[] });
          }
          return forkJoin(
            ids.map((id) => this.apptApi.get(id).pipe(catchError(() => of(null)))),
          ).pipe(
            map((rows) => ({
              customer,
              appointments: rows
                .filter((row): row is NonNullable<typeof row> => !!row)
                .map((row) => mapAppointment(row))
                .filter((a) => a.customerId === customer.id && isAvailableAppointment(a))
                .sort(
                  (a, b) =>
                    (a.appointmentDate?.getTime() ?? 0) - (b.appointmentDate?.getTime() ?? 0),
                ),
            })),
          );
        }),
      )
      .subscribe({
        next: ({ customer, appointments }) => {
          this.loading.set(false);
          this.customer.set(customer);
          this.appointments.set(appointments);
          this.family.set(null);
          this.piercingKind.set(null);
          this.customerPayload.set(null);
          if (appointments.length) {
            this.selectedId.set(appointments[0].id);
            this.step.set('existing');
            return;
          }
          this.step.set('service');
        },
        error: (err) => {
          this.loading.set(false);
          this.errors.handle(err);
        },
      });
  }

  existingNotice(): { kind: 'alert' | 'info'; text: string; canSign: boolean } | null {
    const a = this.selectedAppointment();
    if (!a) return null;
    if (a.hasSignedContract && !a.contractPendingArtistSignature) {
      return {
        kind: 'info',
        text: 'Esta cita ya tiene el contrato firmado.',
        canSign: false,
      };
    }
    if (a.hasSignedContract && a.contractPendingArtistSignature) {
      return {
        kind: 'info',
        text: 'El cliente ya firmó. Falta la firma del profesional en el panel.',
        canSign: false,
      };
    }
    const draft = readKioskDraftId() === a.id && a.financials.total <= 0.009;
    if (draft && appointmentRequiresContractSafe(a)) {
      return {
        kind: 'info',
        text: 'Esta cita se agendó en esta tableta. Continúa con el cuestionario: ahí se registra el valor del trabajo.',
        canSign: true,
      };
    }
    const pay = appointmentPaymentReadyForSignature(a);
    if (!pay.ok) {
      return { kind: 'alert', text: UNPAID_MESSAGE, canSign: false };
    }
    if (!appointmentRequiresContractSafe(a)) {
      return {
        kind: 'info',
        text: 'Esta cita ya está agendada. Limpieza y cambio de joya no requieren contrato.',
        canSign: false,
      };
    }
    return {
      kind: 'info',
      text: 'El valor del trabajo está completo. Puedes continuar con la firma.',
      canSign: true,
    };
  }

  continueExisting(): void {
    const a = this.selectedAppointment();
    if (!a || !this.existingNotice()?.canSign) return;
    void this.router.navigate(['/firmar', 'cita', a.id]);
  }

  startAnotherAppointment(): void {
    this.family.set(null);
    this.piercingKind.set(null);
    this.customerPayload.set(null);
    this.storeId.set(0);
    this.staffId.set(0);
    this.priceCop.set(null);
    this.priceDisplay.set('');
    this.step.set('service');
  }

  goToCustomer(): void {
    if (!this.workKind()) {
      this.toast.warn('Elige el tipo de trabajo.');
      return;
    }
    const { documentType, documentNumber } = this.docForm.getRawValue();
    const current = this.customer();
    if (!current) {
      this.customer.set(blankCustomer(documentType, documentNumber.trim()));
    }
    this.step.set('customer');
  }

  onCustomerSaved(payload: CustomerWritePayload): void {
    const { documentType, documentNumber } = this.docForm.getRawValue();
    const saved: CustomerWritePayload = {
      ...payload,
      document_type: documentType,
      document_number: documentNumber.trim(),
    };
    const current =
      this.customer() ?? blankCustomer(documentType, documentNumber.trim());
    this.customerPayload.set(saved);
    this.customer.set(customerFromPayload(current, saved));
    if (!this.staffForStore().some((p) => p.id === this.staffId())) {
      this.staffId.set(0);
    }
    this.step.set('schedule');
    if (!this.stores().length || !this.staff().length) {
      this.storesApi.listActive().subscribe({
        next: (rows) => this.stores.set(rows),
        error: (err) => this.errors.handle(err),
      });
      this.staffApi.listAssignable().subscribe({
        next: (rows) => this.staff.set(rows),
        error: (err) => this.errors.handle(err),
      });
    }
  }

  confirmSchedule(): void {
    const kind = this.workKind();
    const payload = this.customerPayload();
    const staffId = this.staffId();
    if (!kind || !payload) return;
    if (this.storeId() <= 0) {
      this.toast.warn('Selecciona la tienda.');
      return;
    }
    if (!staffId || !this.staffForStore().some((p) => p.id === staffId)) {
      this.toast.warn(`Selecciona el ${this.assigneeNoun()} de esa tienda.`);
      return;
    }
    const requires = bookingWorkKindRequiresContract(kind);
    let total = 0;
    if (!requires) {
      total = Math.round(Number(this.priceCop() ?? 0));
      const min = minTotalCopForWorkKind(kind);
      if (total < min) {
        this.toast.warn(`Indica un valor de al menos ${formatCop(min)}.`);
        return;
      }
    }
    const existingId = this.customer()?.id ?? 0;
    const saveCustomer$ =
      existingId > 0
        ? this.customersApi.update(existingId, payload).pipe(map(() => existingId))
        : this.customersApi.create(payload).pipe(map((r) => Number(r.id ?? 0)));

    this.saving.set(true);
    saveCustomer$
      .pipe(
        switchMap((customerId) => {
          if (customerId <= 0) {
            throw new Error('No se pudo guardar el cliente.');
          }
          const { service, detail } = serviceAndDetailForWorkKind(kind, '');
          const scheduled = appendAgendaSlotsMarker(detail, 1);
          const withDesign =
            kind === 'cambio_piercing'
              ? detailWithReceiptDesign(scheduled, 'Cambio de piercing')
              : scheduled;
          return this.apptApi.create({
            name: `${payload.first_name} ${payload.last_name}`.trim(),
            phone: payload.phone_number,
            service,
            date: signingAgendaDateTime(),
            detail: withDesign,
            deposit: requires ? 0 : total,
            total_amount: total,
            pending_balance: 0,
            is_priority: false,
            assigned_panel_user_id: staffId,
            customer_id: customerId,
          });
        }),
      )
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          const id = Number(res?.id ?? 0);
          if (id <= 0) {
            this.toast.error('La cita no devolvió un identificador.');
            return;
          }
          if (requires) {
            writeKioskDraftId(id);
            this.toast.success('Cita agendada. Sigue con el cuestionario y el contrato.');
            void this.router.navigate(['/firmar', 'cita', id]);
            return;
          }
          this.toast.success('Cita agendada');
          this.step.set('done');
        },
        error: (err) => {
          this.saving.set(false);
          this.errors.handle(err);
        },
      });
  }

  restart(): void {
    this.step.set('document');
    this.customer.set(null);
    this.appointments.set([]);
    this.selectedId.set(0);
    this.family.set(null);
    this.piercingKind.set(null);
    this.customerPayload.set(null);
    this.storeId.set(0);
    this.staffId.set(0);
    this.priceCop.set(null);
    this.priceDisplay.set('');
  }

  whenLabel(a: Appointment): string {
    return formatSearchHitDatetime(a.appointmentDateRaw);
  }

  workLabel(a: Appointment): string {
    const kind = inferWorkKindFromAppointment(a);
    return BOOKING_WORK_KIND_META[kind]?.label ?? a.serviceType;
  }

  workKindLabel(kind: BookingWorkKind): string {
    return BOOKING_WORK_KIND_META[kind]?.label ?? kind;
  }

  assigneeNoun(): string {
    const kind = this.workKind();
    if (!kind) return 'profesional';
    return assigneeRoleNoun(workKindToAssigneeRole(kind));
  }

  assigneeTitle(): string {
    const noun = this.assigneeNoun();
    return noun.charAt(0).toUpperCase() + noun.slice(1);
  }

  onStoreChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.storeId.set(Number.isFinite(value) ? value : 0);
    this.staffId.set(0);
  }

  onStaffChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.staffId.set(Number.isFinite(value) ? value : 0);
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const amount = parseThousandsCopInput(input.value);
    const formatted = formatThousandsCopInput(amount);
    this.priceCop.set(amount);
    this.priceDisplay.set(formatted);
    input.value = formatted;
  }
}

function appointmentRequiresContractSafe(appt: Appointment): boolean {
  return bookingWorkKindRequiresContract(inferWorkKindFromAppointment(appt));
}
