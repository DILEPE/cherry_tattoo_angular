import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Pipe({ name: 'formError', standalone: true })
export class FormErrorPipe implements PipeTransform {
  transform(control: AbstractControl | null): string {
    if (!control?.errors || !(control.dirty || control.touched)) return '';
    const errors = control.errors;
    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['pastDate']) return 'La fecha debe ser hoy o futura';
    if (errors['invalidPhone']) return 'Teléfono inválido';
    if (errors['minCop']) return `Mínimo COP $${errors['minCop'].min}`;
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['min']) return 'Valor demasiado bajo';
    if (errors['noStaff']) return 'No hay profesional disponible para este tipo de trabajo';
    return 'Campo inválido';
  }
}
