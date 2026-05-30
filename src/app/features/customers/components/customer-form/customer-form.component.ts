import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer, CUSTOMER_BIRTH_PENDING_ISO, DocumentType } from '../../models/customer.model';
import { customerToWritePayload } from '../../models/customer.mapper';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import {
  birthDateInRangeValidator,
  documentNumberValidator,
  mobilePhoneCo10Validator,
  optionalMobilePhoneCo10Validator,
  socialMediaMaxLenValidator,
  trimRequiredValidator,
} from '../../../../shared/forms/form-validators';
import { validateCustomerBusinessRules } from '../../../../shared/forms/customer-business-rules';
import { CUSTOMER_FIELD_LABELS } from '../../../../shared/forms/form-field-labels';
import {
  collectFormValidationIssues,
  formatValidationSummaryLines,
  validateFormBeforeSubmit,
} from '../../../../shared/forms/form-submit.util';
import { FormValidationSummaryComponent } from '../../../../shared/forms/form-validation-summary/form-validation-summary.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';

const DOC_TYPES: DocumentType[] = ['CC', 'TI', 'CE', 'PAS'];

function isMinorByBirthIso(iso: string): boolean {
  if (!iso || iso === CUSTOMER_BIRTH_PENDING_ISO) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return false;
  const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
  return age < 18;
}

@Component({
  selector: 'app-customer-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppFormFieldComponent,
    FormValidationSummaryComponent,
    FormShowErrorsDirective,
  ],
  template: `
    <form
      [formGroup]="form"
      [class.cust-form--readonly]="readonly()"
      appFormShowErrors
      (ngSubmit)="submit()"
      novalidate
    >
      @if (!readonly()) {
        <app-form-validation-summary [messages]="validationSummary()" />
      }
      <h4 class="cust-form-section">Datos personales</h4>
      <div class="cust-form-grid">
        <app-form-field label="Nombre *" [control]="form.controls.firstName">
          <input formControlName="firstName" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Apellidos *" [control]="form.controls.lastName">
          <input formControlName="lastName" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Fecha de nacimiento *" [control]="form.controls.birthDate">
          <input type="date" formControlName="birthDate" />
        </app-form-field>
        @if (birthPending()) {
          <p class="cust-form-hint">Nacimiento pendiente: completa la fecha real cuando la tengas.</p>
        }
        <app-form-field label="Tipo documento *" [control]="form.controls.documentType">
          <select formControlName="documentType">
            @for (t of docTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </app-form-field>
        <app-form-field label="Número documento *" [control]="form.controls.documentNumber">
          <input formControlName="documentNumber" autocomplete="off" />
        </app-form-field>
        @if (!birthPending()) {
          @if (readonly()) {
            @if (form.controls.documentIssueDate.value) {
              <app-form-field
                label="Expedición documento"
                [control]="form.controls.documentIssueDate"
              >
                <input type="date" formControlName="documentIssueDate" />
              </app-form-field>
            }
          } @else {
            <label class="cust-form-check">
              <input type="checkbox" formControlName="hasDocumentIssue" />
              Indicar fecha de expedición del documento
            </label>
            @if (form.controls.hasDocumentIssue.value) {
              <app-form-field label="Expedición documento *" [control]="form.controls.documentIssueDate">
                <input type="date" formControlName="documentIssueDate" />
              </app-form-field>
            }
          }
        }
      </div>

      <h4 class="cust-form-section">Contacto</h4>
      <div class="cust-form-grid">
        <app-form-field label="Correo *" [control]="form.controls.email">
          <input type="email" formControlName="email" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Teléfono *" [control]="form.controls.phoneNumber">
          <input formControlName="phoneNumber" placeholder="10 dígitos" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Dirección" [control]="form.controls.address">
          <input formControlName="address" />
        </app-form-field>
        <app-form-field label="Nacionalidad" [control]="form.controls.nationality">
          <input formControlName="nationality" />
        </app-form-field>
        <app-form-field label="Profesión" [control]="form.controls.profession">
          <input formControlName="profession" />
        </app-form-field>
        <app-form-field label="Redes / contacto social" [control]="form.controls.socialMedia">
          <input formControlName="socialMedia" maxlength="50" />
        </app-form-field>
      </div>

      <h4 class="cust-form-section">Emergencia</h4>
      <div class="cust-form-grid">
        <app-form-field label="Contacto emergencia" [control]="form.controls.emergencyContactName">
          <input formControlName="emergencyContactName" />
        </app-form-field>
        <app-form-field label="Teléfono emergencia" [control]="form.controls.emergencyContactPhone">
          <input formControlName="emergencyContactPhone" placeholder="10 dígitos" />
        </app-form-field>
      </div>

      @if (isMinor()) {
        <h4 class="cust-form-section">Tutor (menor de edad)</h4>
        <div class="cust-form-grid">
          <app-form-field label="Nombre tutor" [control]="form.controls.guardianName">
            <input formControlName="guardianName" />
          </app-form-field>
          <app-form-field label="Tipo doc. tutor" [control]="form.controls.guardianDocumentType">
            <select formControlName="guardianDocumentType">
              @for (t of guardianDocTypes; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </app-form-field>
          <app-form-field label="Número doc. tutor" [control]="form.controls.guardianDocumentNumber">
            <input formControlName="guardianDocumentNumber" />
          </app-form-field>
          @if (readonly()) {
            @if (form.controls.guardianDocumentIssueDate.value) {
              <app-form-field
                label="Expedición tutor"
                [control]="form.controls.guardianDocumentIssueDate"
              >
                <input type="date" formControlName="guardianDocumentIssueDate" />
              </app-form-field>
            }
          } @else {
            <label class="cust-form-check">
              <input type="checkbox" formControlName="hasGuardianIssue" />
              Fecha expedición documento tutor
            </label>
            @if (form.controls.hasGuardianIssue.value) {
              <app-form-field label="Expedición tutor *" [control]="form.controls.guardianDocumentIssueDate">
                <input type="date" formControlName="guardianDocumentIssueDate" />
              </app-form-field>
            }
          }
        </div>
      }

      <ng-content select="[actions]" />
    </form>
  `,
})
export class CustomerFormComponent {
  readonly initial = input<Customer | null>(null);
  /** Solo lectura: mismos campos deshabilitados (visualización de contrato / revisión). */
  readonly readonly = input(false);
  readonly submitted = output<ReturnType<typeof customerToWritePayload>>();

  protected readonly docTypes = DOC_TYPES;
  protected readonly guardianDocTypes: DocumentType[] = ['CC', 'CE', 'PAS'];

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly validationSummary = signal<string[]>([]);
  private readonly formShowErrors = viewChild(FormShowErrorsDirective);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', trimRequiredValidator()],
    lastName: ['', trimRequiredValidator()],
    birthDate: ['', [Validators.required, birthDateInRangeValidator()]],
    documentType: ['CC' as DocumentType, Validators.required],
    documentNumber: ['', documentNumberValidator()],
    hasDocumentIssue: [false],
    documentIssueDate: [''],
    email: ['', [trimRequiredValidator(), Validators.email]],
    phoneNumber: ['', mobilePhoneCo10Validator()],
    address: [''],
    nationality: [''],
    profession: [''],
    socialMedia: ['', socialMediaMaxLenValidator()],
    emergencyContactName: [''],
    emergencyContactPhone: ['', optionalMobilePhoneCo10Validator()],
    guardianName: [''],
    guardianDocumentType: ['CC' as DocumentType],
    guardianDocumentNumber: [''],
    hasGuardianIssue: [false],
    guardianDocumentIssueDate: [''],
  });

  birthPending(): boolean {
    return this.form.controls.birthDate.value === CUSTOMER_BIRTH_PENDING_ISO;
  }

  isMinor(): boolean {
    return isMinorByBirthIso(this.form.controls.birthDate.value);
  }

  private readonly _issueValidators = effect(() => {
    const hasIssue = this.form.controls.hasDocumentIssue.value;
    const issueCtrl = this.form.controls.documentIssueDate;
    if (hasIssue && !this.birthPending()) {
      issueCtrl.setValidators([Validators.required, birthDateInRangeValidator()]);
    } else {
      issueCtrl.clearValidators();
    }
    issueCtrl.updateValueAndValidity({ emitEvent: false });
  });

  private readonly _guardianIssueValidators = effect(() => {
    const has = this.form.controls.hasGuardianIssue.value;
    const ctrl = this.form.controls.guardianDocumentIssueDate;
    if (has && this.isMinor()) {
      ctrl.setValidators([Validators.required, birthDateInRangeValidator()]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  });

  private readonly _readonlyMode = effect(() => {
    this.readonly();
    this.initial();
    if (this.readonly()) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  });

  private readonly _patch = effect(() => {
    const c = this.initial();
    if (!c) {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      this.form.reset({
        firstName: '',
        lastName: '',
        birthDate: iso,
        documentType: 'CC',
        documentNumber: '',
        hasDocumentIssue: false,
        documentIssueDate: '',
        email: '',
        phoneNumber: '',
        address: '',
        nationality: '',
        profession: '',
        socialMedia: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        guardianName: '',
        guardianDocumentType: 'CC',
        guardianDocumentNumber: '',
        hasGuardianIssue: false,
        guardianDocumentIssueDate: '',
      });
      return;
    }
    this.form.patchValue({
      firstName: c.firstName,
      lastName: c.lastName,
      birthDate: c.birthDate,
      documentType: c.documentType,
      documentNumber: c.documentNumber,
      hasDocumentIssue: !!c.documentIssueDate,
      documentIssueDate: c.documentIssueDate ?? '',
      email: c.email,
      phoneNumber: c.phoneNumber,
      address: c.address ?? '',
      nationality: c.nationality ?? '',
      profession: c.profession ?? '',
      socialMedia: c.socialMedia ?? '',
      emergencyContactName: c.emergencyContactName ?? '',
      emergencyContactPhone: c.emergencyContactPhone ?? '',
      guardianName: c.guardianName ?? '',
      guardianDocumentType: c.guardianDocumentType ?? 'CC',
      guardianDocumentNumber: c.guardianDocumentNumber ?? '',
      hasGuardianIssue: !!c.guardianDocumentIssueDate,
      guardianDocumentIssueDate: c.guardianDocumentIssueDate ?? '',
    });
    if (this.readonly()) {
      this.form.disable({ emitEvent: false });
    }
  });

  isMinorFromForm(): boolean {
    return isMinorByBirthIso(this.form.getRawValue().birthDate);
  }

  /** Valida el formulario y devuelve el payload API; `null` si hay errores. */
  tryGetWritePayload(): ReturnType<typeof customerToWritePayload> | null {
    if (this.readonly()) return null;
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: CUSTOMER_FIELD_LABELS,
        onInvalid: () => this.formShowErrors()?.activate(),
      })
    ) {
      const issues = collectFormValidationIssues(this.form, CUSTOMER_FIELD_LABELS);
      this.validationSummary.set(formatValidationSummaryLines(issues));
      this.cdr.markForCheck();
      return null;
    }
    this.validationSummary.set([]);
    this.formShowErrors()?.reset();

    const v = this.form.getRawValue();
    const minor = isMinorByBirthIso(v.birthDate);
    const businessErr = validateCustomerBusinessRules({
      birthDate: v.birthDate,
      documentType: v.documentType,
      documentNumber: v.documentNumber,
      hasDocumentIssue: v.hasDocumentIssue,
      documentIssueDate: v.documentIssueDate,
      isMinor: minor,
      guardianDocumentType: minor ? v.guardianDocumentType : null,
      socialMedia: v.socialMedia,
      emergencyContactPhone: v.emergencyContactPhone,
    });
    if (businessErr) {
      this.validationSummary.set([businessErr]);
      this.toast.warn(businessErr);
      this.cdr.markForCheck();
      return null;
    }

    const pending = v.birthDate === CUSTOMER_BIRTH_PENDING_ISO;
    const customer: Customer = {
      id: this.initial()?.id ?? 0,
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      birthDate: v.birthDate,
      birthDatePending: pending,
      documentType: v.documentType,
      documentNumber: v.documentNumber.trim(),
      documentIssueDate:
        !pending && v.hasDocumentIssue && v.documentIssueDate
          ? v.documentIssueDate
          : null,
      email: v.email.trim(),
      phoneNumber: v.phoneNumber.trim(),
      address: v.address.trim() || null,
      nationality: v.nationality.trim() || null,
      profession: v.profession.trim() || null,
      socialMedia: v.socialMedia.trim() || null,
      emergencyContactName: v.emergencyContactName.trim() || null,
      emergencyContactPhone: v.emergencyContactPhone.trim() || null,
      isMinor: minor,
      guardianName: minor ? v.guardianName.trim() || null : null,
      guardianDocumentType: minor ? v.guardianDocumentType : null,
      guardianDocumentNumber: minor ? v.guardianDocumentNumber.trim() || null : null,
      guardianDocumentIssueDate:
        minor && v.hasGuardianIssue && v.guardianDocumentIssueDate
          ? v.guardianDocumentIssueDate
          : null,
      createdAt: this.initial()?.createdAt ?? null,
      updatedAt: this.initial()?.updatedAt ?? null,
    };
    return customerToWritePayload(customer);
  }

  submit(): void {
    const payload = this.tryGetWritePayload();
    if (payload) this.submitted.emit(payload);
  }
}
