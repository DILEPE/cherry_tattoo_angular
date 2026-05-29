import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida contenido HTML de Quill (ignora `<p><br></p>` vacío). */
export function richHtmlRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const html = String(control.value ?? '');
    const text = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text ? null : { required: true };
  };
}
