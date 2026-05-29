import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function formErrorMessage(
  control: AbstractControl | null,
  errors?: ValidationErrors | null,
): string {
  const e = errors ?? control?.errors;
  if (!e) return '';
  if (e['required']) return 'Este campo es obligatorio';
  if (e['email']) return 'Correo electrónico inválido';
  if (e['pastDate']) return 'La fecha no puede ser anterior a hoy';
  if (e['futureDate']) return 'La fecha no puede ser futura';
  if (e['invalidDate']) return 'Fecha inválida';
  if (e['birthDateTooOld']) return 'La fecha de nacimiento no puede ser anterior a 100 años';
  if (e['mobilePhoneCo10']) return 'El celular debe tener exactamente 10 dígitos';
  if (e['invalidPhone']) return 'Teléfono inválido';
  if (e['socialMediaMaxLen']) return `Máximo ${e['socialMediaMaxLen'].max} caracteres`;
  if (e['minCop']) return `Mínimo COP $${Number(e['minCop'].min).toLocaleString('es-CO')}`;
  if (e['minlength'])
    return `Mínimo ${e['minlength'].requiredLength} caracteres`;
  if (e['maxlength'])
    return `Máximo ${e['maxlength'].requiredLength} caracteres`;
  if (e['min']) return 'Valor demasiado bajo';
  if (e['max']) return 'Valor demasiado alto';
  if (e['noStaff']) return 'No hay profesional disponible para este tipo de trabajo';
  if (e['depositExceedsTotal']) return 'El abono no puede ser mayor al valor total';
  if (e['customerBusinessRules']) return String(e['customerBusinessRules'].message ?? '');
  return 'Campo inválido';
}

@Pipe({ name: 'formError', standalone: true, pure: false })
export class FormErrorPipe implements PipeTransform {
  transform(control: AbstractControl | null): string {
    if (!control?.errors) return '';
    if (!(control.touched || control.dirty)) return '';
    return formErrorMessage(control);
  }
}
