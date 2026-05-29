import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-validation-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (messages().length) {
      <div class="form-validation-summary" role="alert">
        <p class="form-validation-summary__title">Faltan datos por completar o corregir:</p>
        <ul class="form-validation-summary__list">
          @for (line of messages(); track line) {
            <li>{{ line }}</li>
          }
        </ul>
      </div>
    }
  `,
})
export class FormValidationSummaryComponent {
  readonly messages = input<string[]>([]);
}
