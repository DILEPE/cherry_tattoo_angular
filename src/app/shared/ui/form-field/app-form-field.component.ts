import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { merge, startWith } from 'rxjs';
import { formErrorMessage } from '../../forms/form-errors.pipe';
import { FORM_SHOW_ERRORS } from '../../forms/form-show-errors.context';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-field" [class.form-field--error]="!!errorText()">
      @if (label()) {
        <label [for]="controlId()">{{ label() }}</label>
      }
      <ng-content />
      @if (errorText(); as err) {
        <span class="form-field__error" role="alert">{{ err }}</span>
      }
    </div>
  `,
})
export class AppFormFieldComponent {
  readonly label = input<string>('');
  readonly control = input.required<AbstractControl>();
  readonly controlId = input('');

  private readonly formShowErrors = inject(FORM_SHOW_ERRORS, { optional: true });
  private readonly controlRevision = signal(0);

  readonly errorText = computed(() => {
    this.controlRevision();
    const force = this.formShowErrors?.() ?? false;
    const control = this.control();
    if (!control?.errors) return '';
    if (!(force || control.touched || control.dirty)) return '';
    return formErrorMessage(control);
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      if (!control) return;
      const sub = merge(control.statusChanges, control.valueChanges)
        .pipe(startWith(null))
        .subscribe(() => this.controlRevision.update((n) => n + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }
}
