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
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';
import { FormErrorPipe } from '../../../../shared/forms/form-errors.pipe';
import { validateFormBeforeSubmit } from '../../../../shared/forms/form-submit.util';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import {
  CONTRACT_KIND_LABEL_ES,
  CONTRACT_PLACEHOLDERS_HINT,
  ContractKind,
  ContractTemplate,
} from '../../models/contract-template.model';
import { trimRequiredValidator } from '../../../../shared/forms/form-validators';
import { richHtmlRequiredValidator } from '../../../../shared/forms/rich-html-validators';
import { ContractRichEditorComponent } from '../contract-rich-editor/contract-rich-editor.component';

export interface TemplateFormValue {
  name: string;
  contractKind: ContractKind;
  version: string;
  content: string;
  isActive: boolean;
}

@Component({
  selector: 'app-template-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppFormFieldComponent,
    FormShowErrorsDirective,
    ContractRichEditorComponent,
    FormErrorPipe,
  ],
  template: `
    <form [formGroup]="form" appFormShowErrors (ngSubmit)="submit()" novalidate>
      <div class="ct-form-grid">
        <app-form-field label="Nombre *" [control]="form.controls.name">
          <input formControlName="name" autocomplete="off" />
        </app-form-field>
        <app-form-field label="Tipo de trabajo *" [control]="form.controls.contractKind">
          <select formControlName="contractKind">
            @for (k of kinds; track k) {
              <option [value]="k">{{ kindLabel(k) }}</option>
            }
          </select>
        </app-form-field>
        <app-form-field label="Versión *" [control]="form.controls.version">
          <input formControlName="version" placeholder="Ej. 1.0.0" autocomplete="off" />
        </app-form-field>
        <label class="ct-form-check">
          <input type="checkbox" formControlName="isActive" />
          Plantilla activa
        </label>
      </div>
      <section
        class="ct-editor-panel"
        [class.ct-editor-panel--error]="
          form.controls.content.invalid &&
          (form.controls.content.touched || form.controls.content.dirty)
        "
      >
        <header class="ct-editor-panel__header">
          <h4 class="ct-editor-panel__title">Texto del contrato *</h4>
          <p class="ct-editor-panel__hint">{{ placeholdersHint }}</p>
        </header>
        <app-contract-rich-editor
          formControlName="content"
          [showError]="
            form.controls.content.invalid &&
            (form.controls.content.touched || form.controls.content.dirty)
          "
        />
        @if (form.controls.content | formError; as err) {
          @if (err) {
            <span class="form-field__error" role="alert">{{ err }}</span>
          }
        }
      </section>
      <ng-content select="[actions]" />
    </form>
  `,
})
export class TemplateFormComponent {
  readonly initial = input<ContractTemplate | null>(null);
  readonly submitted = output<TemplateFormValue>();

  protected readonly kinds: ContractKind[] = ['tattoo', 'piercing'];
  protected readonly placeholdersHint = CONTRACT_PLACEHOLDERS_HINT;
  protected readonly kindLabel = (k: ContractKind) => CONTRACT_KIND_LABEL_ES[k];

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formShowErrors = viewChild(FormShowErrorsDirective);

  readonly form = this.fb.nonNullable.group({
    name: ['', trimRequiredValidator()],
    contractKind: ['tattoo' as ContractKind, Validators.required],
    version: ['', trimRequiredValidator()],
    content: ['', richHtmlRequiredValidator()],
    isActive: [true],
  });

  private readonly _patch = effect(() => {
    const t = this.initial();
    if (!t) {
      this.form.reset({
        name: '',
        contractKind: 'tattoo',
        version: '',
        content: '',
        isActive: true,
      });
      return;
    }
    this.form.patchValue({
      name: t.name,
      contractKind: t.contractKind,
      version: t.version,
      content: t.content,
      isActive: t.isActive,
    });
    this.cdr.markForCheck();
  });

  submit(): void {
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: {
          name: 'Nombre',
          contractKind: 'Tipo de trabajo',
          version: 'Versión',
          content: 'Texto del contrato',
        },
        onInvalid: () => this.formShowErrors()?.activate(),
      })
    ) {
      this.cdr.markForCheck();
      return;
    }
    this.formShowErrors()?.reset();
    const v = this.form.getRawValue();
    this.submitted.emit({
      name: v.name,
      contractKind: v.contractKind,
      version: v.version,
      content: v.content,
      isActive: v.isActive,
    });
  }

}
