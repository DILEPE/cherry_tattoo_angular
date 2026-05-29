import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';
import { validateFormBeforeSubmit } from '../../../../shared/forms/form-submit.util';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { trimRequiredValidator } from '../../../../shared/forms/form-validators';
import {
  SurveyQuestion,
  SurveyQuestionFormValue,
  SurveyQuestionScope,
  SurveyQuestionType,
  SURVEY_QUESTION_TYPES_ALL,
  SURVEY_QUESTION_TYPES_CREATE,
  SURVEY_SCOPE_LABEL_ES,
  SURVEY_TYPES_NEEDING_OPTIONS,
} from '../../models/survey-question.model';
import { questionToFormValue } from '../../models/survey-question.mapper';

@Component({
  selector: 'app-survey-question-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppFormFieldComponent,
    FormShowErrorsDirective,
  ],
  template: `
    <form [formGroup]="form" appFormShowErrors (ngSubmit)="submit()" novalidate>
      <app-form-field label="Tipo de respuesta *" [control]="form.controls.questionType">
        <select formControlName="questionType">
          @for (t of typeOptions(); track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select>
      </app-form-field>

      <app-form-field label="Texto de la pregunta *" [control]="form.controls.label">
        <input
          formControlName="label"
          maxlength="500"
          placeholder="Ej: ¿Cómo calificarías tu experiencia con nosotros?"
          autocomplete="off"
        />
      </app-form-field>

      @if (needsOptions()) {
        <app-form-field label="Opciones (una por línea, mínimo 2) *" [control]="form.controls.optionsLines">
          <textarea
            formControlName="optionsLines"
            rows="5"
            class="sq-form-options"
            placeholder="Muy buena&#10;Buena&#10;Regular&#10;Mala"
          ></textarea>
        </app-form-field>
      }

      <fieldset class="sq-form-scope">
        <legend>¿Para qué servicio aplica?</legend>
        <div class="sq-form-scope__options">
          @for (s of scopes; track s) {
            <label class="sq-form-scope__item">
              <input type="radio" formControlName="contractKind" [value]="s" />
              {{ scopeLabel(s) }}
            </label>
          }
        </div>
      </fieldset>

      @if (showActiveToggle()) {
        <label class="sq-form-check">
          <input type="checkbox" formControlName="isActive" />
          Pregunta activa (visible en la encuesta al firmar)
        </label>
      }

      <ng-content select="[actions]" />
    </form>
  `,
})
export class SurveyQuestionFormComponent {
  readonly initial = input<SurveyQuestion | null>(null);
  readonly allowHistoricTextType = input(false);
  readonly showActiveToggle = input(false);
  readonly submitted = output<SurveyQuestionFormValue>();

  protected readonly scopes: SurveyQuestionScope[] = ['tattoo', 'piercing', 'both'];
  protected readonly scopeLabel = (s: SurveyQuestionScope) => SURVEY_SCOPE_LABEL_ES[s];

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formShowErrors = viewChild(FormShowErrorsDirective);

  readonly typeOptions = computed(() =>
    this.allowHistoricTextType() ? SURVEY_QUESTION_TYPES_ALL : SURVEY_QUESTION_TYPES_CREATE,
  );

  readonly form = this.fb.nonNullable.group({
    questionType: ['rating_1_5' as SurveyQuestionType, Validators.required],
    label: ['', [trimRequiredValidator(), Validators.maxLength(500)]],
    optionsLines: [''],
    contractKind: ['both' as SurveyQuestionScope, Validators.required],
    isActive: [true],
  });

  private readonly questionType = toSignal(
    this.form.controls.questionType.valueChanges.pipe(
      startWith(this.form.controls.questionType.value),
    ),
    { initialValue: this.form.controls.questionType.value },
  );

  readonly needsOptions = computed(() =>
    SURVEY_TYPES_NEEDING_OPTIONS.has(this.questionType()),
  );

  constructor() {
    effect(() => {
      const t = this.questionType();
      const ctrl = this.form.controls.optionsLines;
      if (SURVEY_TYPES_NEEDING_OPTIONS.has(t)) {
        ctrl.setValidators([trimRequiredValidator()]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private readonly _patch = effect(() => {
    const q = this.initial();
    if (!q) {
      this.form.reset({
        questionType: 'rating_1_5',
        label: '',
        optionsLines: '',
        contractKind: 'both',
        isActive: true,
      });
      return;
    }
    this.form.patchValue(questionToFormValue(q));
    this.cdr.markForCheck();
  });

  submit(): void {
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: {
          questionType: 'Tipo de respuesta',
          label: 'Texto de la pregunta',
          optionsLines: 'Opciones',
          contractKind: 'Servicio',
        },
        onInvalid: () => this.formShowErrors()?.activate(),
      })
    ) {
      this.cdr.markForCheck();
      return;
    }
    const v = this.form.getRawValue();
    const lines = v.optionsLines.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (SURVEY_TYPES_NEEDING_OPTIONS.has(v.questionType) && lines.length < 2) {
      this.toast.warn('Añade al menos dos opciones de respuesta.');
      this.form.controls.optionsLines.markAsTouched();
      this.formShowErrors()?.activate();
      this.cdr.markForCheck();
      return;
    }
    this.formShowErrors()?.reset();
    this.submitted.emit({
      label: v.label,
      questionType: v.questionType,
      optionsLines: v.optionsLines,
      contractKind: v.contractKind,
      isActive: v.isActive,
    });
  }
}
