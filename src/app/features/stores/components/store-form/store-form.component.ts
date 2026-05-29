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
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store, StoreWritePayload } from '../../../../core/models/store.model';
import { formToWritePayload, storeToFormValue } from '../../../../core/models/store.mapper';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import {
  collectFormValidationIssues,
  formatValidationSummaryLines,
  validateFormBeforeSubmit,
} from '../../../../shared/forms/form-submit.util';
import { FormValidationSummaryComponent } from '../../../../shared/forms/form-validation-summary/form-validation-summary.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';
import {
  STORE_FIELD_LABELS,
  storeAddressValidators,
  storeEmailValidators,
  storeNameValidators,
  storePhoneValidators,
} from '../../models/store.validators';

@Component({
  selector: 'app-store-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppFormFieldComponent,
    FormValidationSummaryComponent,
    FormShowErrorsDirective,
  ],
  template: `
    <form [formGroup]="form" appFormShowErrors (ngSubmit)="submit()" novalidate>
      <app-form-validation-summary [messages]="validationSummary()" />
      <div class="st-form-grid">
        <app-form-field label="Nombre *" [control]="form.controls.name">
          <input formControlName="name" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Dirección" [control]="form.controls.address">
          <input formControlName="address" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Teléfono" [control]="form.controls.phone">
          <input formControlName="phone" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Correo" [control]="form.controls.email">
          <input type="email" formControlName="email" autocomplete="off" />
        </app-form-field>
      </div>
      <label class="st-form-check">
        <input type="checkbox" formControlName="isActive" />
        Activa
      </label>
      <ng-content select="[actions]" />
    </form>
  `,
})
export class StoreFormComponent {
  readonly initial = input<Store | null>(null);
  readonly submitted = output<StoreWritePayload>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly validationSummary = signal<string[]>([]);
  private readonly formShowErrors = viewChild(FormShowErrorsDirective);

  readonly form = this.fb.nonNullable.group({
    name: ['', storeNameValidators],
    address: ['', storeAddressValidators],
    phone: ['', storePhoneValidators],
    email: ['', storeEmailValidators],
    isActive: [true],
  });

  private readonly _patch = effect(() => {
    const store = this.initial();
    if (!store) {
      this.form.reset({
        name: '',
        address: '',
        phone: '',
        email: '',
        isActive: true,
      });
      return;
    }
    this.form.patchValue(storeToFormValue(store));
  });

  submit(): void {
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: STORE_FIELD_LABELS,
        onInvalid: () => this.formShowErrors()?.activate(),
      })
    ) {
      const issues = collectFormValidationIssues(this.form, STORE_FIELD_LABELS);
      this.validationSummary.set(formatValidationSummaryLines(issues));
      this.cdr.markForCheck();
      return;
    }
    this.validationSummary.set([]);
    this.formShowErrors()?.reset();
    this.submitted.emit(formToWritePayload(this.form.getRawValue()));
  }
}
