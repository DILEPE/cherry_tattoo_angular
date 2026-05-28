import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const d = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today ? null : { pastDate: { value: control.value } };
  };
}

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const pattern = /^\+?[0-9]{7,15}$/;
    return !control.value || pattern.test(String(control.value))
      ? null
      : { invalidPhone: true };
  };
}

export function minCopAmountValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = Number(control.value);
    if (!control.value && control.value !== 0) return null;
    return v >= min ? null : { minCop: { min, actual: v } };
  };
}
