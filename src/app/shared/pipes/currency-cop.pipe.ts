import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCop', standalone: true })
export class CurrencyCopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const amount = Math.round(Number(value ?? 0));
    return `COP $${amount.toLocaleString('es-CO').replace(/,/g, '.')}`;
  }
}
