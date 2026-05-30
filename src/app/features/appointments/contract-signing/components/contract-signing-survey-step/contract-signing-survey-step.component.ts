import {

  ChangeDetectionStrategy,

  Component,

  OnInit,

  inject,

  input,

  output,

  signal,

} from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SurveyQuestion } from '../../../../surveys/models/survey-question.model';

import { AppButtonComponent } from '../../../../../shared/ui/button/app-button.component';

import {

  SurveyAnswerPayload,

  SurveySubmitPayload,

} from '../../services/contract-signing-api.service';

import {

  formatSurveyQuestionLabel,

  surveyQuestionSpansFullWidth,

} from '../../models/survey-question-label.util';



@Component({

  selector: 'app-contract-signing-survey-step',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [ReactiveFormsModule, AppButtonComponent],

  template: `

    @if (errors().length) {

      <ul class="form-field__error ctsig-errors" role="alert">

        @for (e of errors(); track e) {

          <li>{{ e }}</li>

        }

      </ul>

    }

    <form [formGroup]="form" (ngSubmit)="submit()" class="ctsig-survey-form">

      <div class="ctsig-survey-grid">

        @for (q of questions(); track q.id) {

          <div
            class="ctsig-survey-card"
            role="group"
            [class.ctsig-survey-card--wide]="isFullWidth(q)"
            [attr.aria-labelledby]="questionLabelId(q)"
          >
            <p class="ctsig-survey-q-label" [id]="questionLabelId(q)">{{ questionLabel(q) }}</p>
            <div class="ctsig-survey-card__body">
            @switch (q.questionType) {

              @case ('rating_1_5') {

                <div class="ctsig-segment" role="group" aria-label="Calificación 1 a 5">

                  @for (n of ratingOptions; track n) {

                    <button

                      type="button"

                      class="ctsig-segment__btn"

                      [class.ctsig-segment__btn--active]="

                        form.get(controlName(q.id, 'r'))?.value === n

                      "

                      (click)="setChoice(q.id, 'r', n)"

                    >

                      {{ n }}

                    </button>

                  }

                </div>

              }

              @case ('yes_no') {

                <div class="ctsig-segment" role="group" aria-label="Sí o no">

                  @for (opt of yesNoOptions; track opt) {

                    <button

                      type="button"

                      class="ctsig-segment__btn ctsig-segment__btn--wide"

                      [class.ctsig-segment__btn--active]="

                        form.get(controlName(q.id, 'yn'))?.value === opt

                      "

                      (click)="setChoice(q.id, 'yn', opt)"

                    >

                      {{ opt }}

                    </button>

                  }

                </div>

              }

              @case ('number') {

                <input

                  type="number"

                  class="ctsig-control"

                  [formControlName]="controlName(q.id, 'n')"

                  step="any"

                />

              }

              @case ('textarea') {

                <textarea

                  class="ctsig-control"

                  [formControlName]="controlName(q.id, 't')"

                  rows="4"

                ></textarea>

              }

              @case ('text_short') {

                <input

                  type="text"

                  class="ctsig-control"

                  [formControlName]="controlName(q.id, 't')"

                  maxlength="500"

                />

              }

              @case ('radio') {

                @if (q.options.length < 2) {

                  <p class="ctsig-survey-hint ctsig-survey-hint--warn">

                    Esta pregunta no tiene opciones configuradas; avisa al administrador.

                  </p>

                } @else {

                  <select class="ctsig-control" [formControlName]="controlName(q.id, 'radio')">

                    <option value="">— Selecciona —</option>

                    @for (o of q.options; track o) {

                      <option [value]="o">{{ o }}</option>

                    }

                  </select>

                }

              }

              @case ('select') {

                @if (q.options.length < 2) {

                  <p class="ctsig-survey-hint ctsig-survey-hint--warn">

                    Esta pregunta no tiene opciones configuradas; avisa al administrador.

                  </p>

                } @else {

                  <select class="ctsig-control" [formControlName]="controlName(q.id, 'sel')">

                    <option value="">— Selecciona —</option>

                    @for (o of q.options; track o) {

                      <option [value]="o">{{ o }}</option>

                    }

                  </select>

                }

              }

              @case ('checkbox') {

                @if (q.options.length < 2) {

                  <p class="ctsig-survey-hint ctsig-survey-hint--warn">

                    Esta pregunta no tiene opciones configuradas; avisa al administrador.

                  </p>

                } @else {

                  <div class="ctsig-checkbox-grid">

                    @for (o of q.options; track o) {

                      <label class="ctsig-checkbox">

                        <input

                          type="checkbox"

                          [checked]="isChecked(q.id, o)"

                          (change)="toggleCheckbox(q.id, o, $event)"

                        />

                        <span>{{ o }}</span>

                      </label>

                    }

                  </div>

                }

              }

              @default {

                <textarea

                  class="ctsig-control"

                  [formControlName]="controlName(q.id, 't')"

                  rows="3"

                ></textarea>

              }

            }
            </div>
          </div>

        }

      </div>



      <footer class="ctsig-survey-footer">

        <div
          class="ctsig-survey-card ctsig-survey-card--recommend"
          role="group"
          aria-labelledby="ctsig-would-recommend-label"
        >
          <p class="ctsig-survey-q-label" id="ctsig-would-recommend-label">
            ¿Recomendaría nuestros servicios? *
          </p>
          <div class="ctsig-survey-card__body">
          <div class="ctsig-segment" role="group" aria-label="Recomendación">

            @for (opt of yesNoOptions; track opt) {

              <button

                type="button"

                class="ctsig-segment__btn ctsig-segment__btn--wide"

                [class.ctsig-segment__btn--active]="form.get('wouldRecommend')?.value === opt"

                (click)="form.patchValue({ wouldRecommend: opt })"

              >

                {{ opt }}

              </button>

            }

          </div>
          </div>
        </div>

        @if (!inline()) {
          <div class="ctsig-step-actions ctsig-survey-footer__actions">
            <app-button type="button" variant="ghost" (clicked)="back.emit()">
              ← Datos personales
            </app-button>
            <app-button type="submit" variant="primary" [loading]="submitting()">
              Enviar cuestionario
            </app-button>
          </div>
        }

      </footer>

    </form>

  `,

})

export class ContractSigningSurveyStepComponent implements OnInit {

  readonly questions = input.required<SurveyQuestion[]>();

  readonly appointmentId = input.required<number>();

  readonly serviceType = input('');

  /** En flujo sin fases: sin botones propios; el padre valida y envía. */
  readonly inline = input(false);

  readonly submitting = input(false);



  readonly back = output<void>();

  readonly submitted = output<SurveySubmitPayload>();



  protected readonly ratingOptions = [1, 2, 3, 4, 5] as const;

  protected readonly yesNoOptions = ['Sí', 'No'] as const;



  private readonly fb = inject(FormBuilder);

  readonly errors = signal<string[]>([]);

  private readonly checkboxState = signal<Record<string, string[]>>({});



  readonly form: FormGroup = this.fb.group({ wouldRecommend: '' });



  ngOnInit(): void {

    this.buildControls();

  }



  questionLabel(q: SurveyQuestion): string {

    return formatSurveyQuestionLabel(q.label, this.serviceType());

  }

  questionLabelId(q: SurveyQuestion): string {
    return `ctsig-q-${q.id}-label`;
  }

  isFullWidth(q: SurveyQuestion): boolean {

    return surveyQuestionSpansFullWidth(this.questionLabel(q));

  }



  private buildControls(): void {

    for (const q of this.questions()) {

      const qt = q.questionType;

      if (qt === 'rating_1_5') {

        this.form.addControl(this.controlName(q.id, 'r'), this.fb.control(''));

      } else if (qt === 'yes_no') {

        this.form.addControl(this.controlName(q.id, 'yn'), this.fb.control(''));

      } else if (qt === 'number') {

        this.form.addControl(this.controlName(q.id, 'n'), this.fb.control(''));

      } else if (qt === 'radio') {

        this.form.addControl(this.controlName(q.id, 'radio'), this.fb.control(''));

      } else if (qt === 'select') {

        this.form.addControl(this.controlName(q.id, 'sel'), this.fb.control(''));

      } else if (qt !== 'checkbox') {

        this.form.addControl(this.controlName(q.id, 't'), this.fb.control(''));

      }

    }

  }



  controlName(qid: number, suffix: string): string {

    return `q_${qid}_${suffix}`;

  }



  setChoice(qid: number, suffix: string, value: string | number): void {

    this.form.get(this.controlName(qid, suffix))?.setValue(value);

  }



  isChecked(qid: number, option: string): boolean {

    return (this.checkboxState()[String(qid)] ?? []).includes(option);

  }



  toggleCheckbox(qid: number, option: string, ev: Event): void {

    const checked = (ev.target as HTMLInputElement).checked;

    const key = String(qid);

    const prev = [...(this.checkboxState()[key] ?? [])];

    const next = checked ? [...prev, option] : prev.filter((x) => x !== option);

    this.checkboxState.update((s) => ({ ...s, [key]: next }));

  }



  tryBuildPayload(): SurveySubmitPayload | null {
    const errs: string[] = [];

    const wr = String(this.form.get('wouldRecommend')?.value ?? '');

    if (!wr) errs.push('Indica si recomendaría nuestros servicios.');

    const answers: SurveyAnswerPayload[] = [];



    for (const q of this.questions()) {

      const lbl = this.questionLabel(q);

      const qid = q.id;

      const qt = q.questionType;

      if (qt === 'rating_1_5') {

        const raw = this.form.get(this.controlName(qid, 'r'))?.value;

        if (!raw) errs.push(`Selecciona una calificación en «${lbl}».`);

        else answers.push({ question_id: qid, rating: Number(raw) });

      } else if (qt === 'yes_no') {

        const raw = this.form.get(this.controlName(qid, 'yn'))?.value;

        if (!raw) errs.push(`Responde sí o no en «${lbl}».`);

        else answers.push({ question_id: qid, yes_no: raw === 'Sí' });

      } else if (qt === 'number') {

        const raw = this.form.get(this.controlName(qid, 'n'))?.value;

        const num = Number(raw);

        if (raw === '' || raw == null || Number.isNaN(num)) {

          errs.push(`Indica un número válido en «${lbl}».`);

        } else {

          const isMoney =

            lbl.toLowerCase().includes('valor') && lbl.toLowerCase().includes('procedimiento');

          if (isMoney && num <= 0) errs.push(`Indica el valor en «${lbl}».`);

          else answers.push({ question_id: qid, number: isMoney ? Math.round(num) : num });

        }

      } else if (qt === 'radio') {

        if (q.options.length < 2) {

          errs.push(`«${lbl}» no está configurada correctamente.`);

        } else {

          const raw = this.form.get(this.controlName(qid, 'radio'))?.value;

          if (!raw) errs.push(`Elige una opción en «${lbl}».`);

          else answers.push({ question_id: qid, text: String(raw) });

        }

      } else if (qt === 'select') {

        if (q.options.length < 2) {

          errs.push(`«${lbl}» no está configurada correctamente.`);

        } else {

          const raw = this.form.get(this.controlName(qid, 'sel'))?.value;

          if (!raw) errs.push(`Elige una opción en «${lbl}».`);

          else answers.push({ question_id: qid, text: String(raw) });

        }

      } else if (qt === 'checkbox') {

        if (q.options.length < 2) {

          errs.push(`«${lbl}» no está configurada correctamente.`);

        } else {

          const cleaned = this.checkboxState()[String(qid)] ?? [];

          if (!cleaned.length) errs.push(`Marca al menos una opción en «${lbl}».`);

          else answers.push({ question_id: qid, choices: cleaned });

        }

      } else {

        const raw = String(this.form.get(this.controlName(qid, 't'))?.value ?? '').trim();

        if (!raw) errs.push(`Completa «${lbl}».`);

        else answers.push({ question_id: qid, text: raw });

      }

    }



    this.errors.set(errs);

    if (errs.length) return null;

    return {
      appointment_id: this.appointmentId(),
      would_recommend: wr === 'Sí',
      answers,
    };
  }

  submit(): void {
    const payload = this.tryBuildPayload();
    if (payload) this.submitted.emit(payload);
  }

}


