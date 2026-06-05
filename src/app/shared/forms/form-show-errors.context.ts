import { InjectionToken, Signal } from '@angular/core';

/** Señal compartida por `appFormShowErrors` en el `<form>` padre. */
export const FORM_SHOW_ERRORS = new InjectionToken<Signal<boolean>>('FORM_SHOW_ERRORS');
