import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ToastService } from '../ui/toast/toast.service';
import { formErrorMessage } from './form-errors.pipe';

export interface FieldValidationIssue {
  path: string;
  label: string;
  message: string;
}

export interface ValidateFormOptions {
  toast?: ToastService;
  fieldLabels?: Record<string, string>;
  fallbackMessage?: string;
  maxToastFields?: number;
  /** P. ej. activar `appFormShowErrors` para pintar errores bajo cada campo. */
  onInvalid?: () => void;
}

function walkControls(
  form: FormGroup,
  fn: (path: string, control: AbstractControl) => void,
  prefix = '',
): void {
  for (const key of Object.keys(form.controls)) {
    const control = form.get(key)!;
    const path = prefix ? `${prefix}.${key}` : key;
    if (control instanceof FormGroup) {
      walkControls(control, fn, path);
    } else if (control instanceof FormArray) {
      control.controls.forEach((c, i) => {
        if (c instanceof FormGroup) walkControls(c, fn, `${path}[${i}]`);
        else fn(`${path}[${i}]`, c);
      });
    } else {
      fn(path, control);
    }
  }
}

function labelForPath(path: string, fieldLabels: Record<string, string>): string {
  const key = path.includes('.') ? path.split('.').pop()! : path.replace(/\[\d+\]$/, '');
  return fieldLabels[key] ?? fieldLabels[path] ?? key;
}

/** Marca touched + dirty en todo el árbol para forzar mensajes bajo cada campo. */
export function markFormForValidationDisplay(form: FormGroup): void {
  form.markAllAsTouched();
  walkControls(form, (_path, control) => {
    control.markAsTouched();
    control.markAsDirty();
  });
  form.updateValueAndValidity({ emitEvent: false });
}

export function collectFormValidationIssues(
  form: FormGroup,
  fieldLabels: Record<string, string> = {},
): FieldValidationIssue[] {
  const issues: FieldValidationIssue[] = [];
  const seen = new Set<string>();

  walkControls(form, (path, control) => {
    if (!control.errors) return;
    const label = labelForPath(path, fieldLabels);
    const message = formErrorMessage(control) || 'Valor inválido';
    const dedupe = `${label}::${message}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    issues.push({ path, label, message });
  });

  if (form.errors) {
    const groupMsg = formErrorMessage(null, form.errors);
    if (groupMsg) {
      issues.push({ path: '_group', label: 'Formulario', message: groupMsg });
    }
  }

  return issues;
}

export function formatValidationToast(issues: FieldValidationIssue[], max = 6): string {
  if (!issues.length) {
    return 'Revise los campos marcados antes de continuar.';
  }
  const labels = issues.map((i) => i.label).filter((l) => l !== 'Formulario');
  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length === 0) {
    return issues[0]?.message ?? 'Revise los campos marcados antes de continuar.';
  }
  const shown = uniqueLabels.slice(0, max);
  const rest = uniqueLabels.length - shown.length;
  const list = shown.join(', ');
  if (rest > 0) {
    return `Complete los campos obligatorios: ${list} y ${rest} más.`;
  }
  if (uniqueLabels.length === 1) {
    const detail = issues.find((i) => i.label === uniqueLabels[0])?.message;
    return detail
      ? `${uniqueLabels[0]}: ${detail}`
      : `Complete el campo obligatorio: ${uniqueLabels[0]}.`;
  }
  return `Complete los campos obligatorios: ${list}.`;
}

export function formatValidationSummaryLines(issues: FieldValidationIssue[]): string[] {
  return issues.map((i) => `${i.label}: ${i.message}`);
}

/**
 * Marca campos, revalida y devuelve false si hay errores.
 * Toast lista los campos por completar; use collectFormValidationIssues para un resumen en pantalla.
 */
export function validateFormBeforeSubmit(
  form: FormGroup,
  toastOrOptions?: ToastService | ValidateFormOptions,
  legacyFallback?: string,
): boolean {
  let opts: ValidateFormOptions = {};
  if (toastOrOptions && typeof (toastOrOptions as ToastService).warn === 'function' && !('fieldLabels' in (toastOrOptions as object))) {
    opts = { toast: toastOrOptions as ToastService, fallbackMessage: legacyFallback };
  } else if (toastOrOptions) {
    opts = toastOrOptions as ValidateFormOptions;
  }

  markFormForValidationDisplay(form);
  if (form.valid) return true;

  opts.onInvalid?.();

  const issues = collectFormValidationIssues(form, opts.fieldLabels ?? {});
  const msg =
    issues.length > 0
      ? formatValidationToast(issues, opts.maxToastFields ?? 6)
      : (opts.fallbackMessage ?? legacyFallback ?? 'Revise los campos marcados antes de continuar.');

  opts.toast?.warn(msg);
  return false;
}

/** Primer mensaje de error (compatibilidad). */
export function firstFormErrorMessage(form: FormGroup): string | null {
  const issues = collectFormValidationIssues(form);
  return issues[0]?.message ?? null;
}
