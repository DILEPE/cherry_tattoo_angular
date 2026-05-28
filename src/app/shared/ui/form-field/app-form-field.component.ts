import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { FormErrorPipe } from '../../forms/form-errors.pipe';

@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormErrorPipe],
  template: `
    <div class="form-field" [class.form-field--error]="!!(control() | formError)">
      @if (label()) {
        <label [for]="controlId()">{{ label() }}</label>
      }
      <ng-content />
      @if (control() | formError; as err) {
        @if (err) {
          <span class="form-field__error">{{ err }}</span>
        }
      }
    </div>
  `,
})
export class AppFormFieldComponent {
  readonly label = input<string>('');
  readonly control = input.required<AbstractControl>();
  readonly controlId = input('');
}
