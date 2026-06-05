import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

export const SOCIAL_MEDIA_MAX_LEN = 50;

export function trimRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '').trim();
    return v ? null : { required: true };
  };
}

export function mobilePhoneCo10Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const digits = String(control.value ?? '').replace(/\D/g, '');
    if (!digits) return { required: true };
    return digits.length === 10 ? null : { mobilePhoneCo10: true };
  };
}

export function optionalMobilePhoneCo10Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    return digits.length === 10 ? null : { mobilePhoneCo10: true };
  };
}

export function socialMediaMaxLenValidator(max = SOCIAL_MEDIA_MAX_LEN): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) return null;
    return s.length <= max ? null : { socialMediaMaxLen: { max, actual: s.length } };
  };
}

export function optionalEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) return null;
    return Validators.email(control);
  };
}

export function documentNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) return { required: true };
    return s.length >= 5 ? null : { minlength: { requiredLength: 5, actualLength: s.length } };
  };
}

export function birthDateInRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) return { required: true };
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (!m) return { invalidDate: true };
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const min = new Date(today);
    min.setFullYear(min.getFullYear() - 100);
    min.setHours(0, 0, 0, 0);
    if (d > today) return { futureDate: true };
    if (d < min) return { birthDateTooOld: true };
    return null;
  };
}

export function dateNotBeforeTodayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) return { required: true };
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (!m) return { invalidDate: true };
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today ? null : { pastDate: true };
  };
}

export function minCopAmountValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = Number(control.value);
    if (control.value === '' || control.value == null) return { required: true };
    if (!Number.isFinite(v)) return { minCop: { min, actual: v } };
    return v >= min ? null : { minCop: { min, actual: v } };
  };
}

/** Abono inicial no mayor que valor total (formulario agendar cita). */
export function bookingAmountsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const g = control as FormGroup;
    const total = Math.round(Number(g.get('total')?.value ?? 0));
    const deposit = Math.round(Number(g.get('deposit')?.value ?? 0));
    if (deposit > total) return { depositExceedsTotal: true };
    return null;
  };
}
