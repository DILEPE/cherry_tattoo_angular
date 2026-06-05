import { Directive, inject, signal } from '@angular/core';
import { FORM_SHOW_ERRORS } from './form-show-errors.context';

/**
 * Colócalo en el `<form>`: al llamar `activate()` los `app-form-field` hijos
 * muestran el error debajo de cada input aunque OnPush no detecte el cambio.
 */
@Directive({
  selector: 'form[appFormShowErrors]',
  exportAs: 'appFormShowErrors',
  providers: [
    {
      provide: FORM_SHOW_ERRORS,
      useFactory: () => inject(FormShowErrorsDirective).show,
    },
  ],
})
export class FormShowErrorsDirective {
  private readonly _show = signal(false);
  readonly show = this._show.asReadonly();

  activate(): void {
    this._show.set(true);
  }

  reset(): void {
    this._show.set(false);
  }
}
