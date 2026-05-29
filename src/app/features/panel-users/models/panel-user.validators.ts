import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const USERNAME_PATTERN = /^[a-z0-9._-]{3,80}$/;

export function panelUsernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '').trim().toLowerCase();
    if (!v) return { required: true };
    if (!USERNAME_PATTERN.test(v)) return { panelUsername: true };
    return null;
  };
}

export function panelStoreRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const id = Number(control.value ?? 0);
    return id >= 1 ? null : { storeRequired: true };
  };
}

export function panelModulesRequiredValidator(isAdmin: () => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (isAdmin()) return null;
    const mods = control.value;
    if (Array.isArray(mods) && mods.length > 0) return null;
    return { modulesRequired: true };
  };
}
