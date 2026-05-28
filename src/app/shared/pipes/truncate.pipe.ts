import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, max = 40): string {
    const s = (value ?? '').trim();
    if (s.length <= max) return s || '—';
    return `${s.slice(0, max - 1)}…`;
  }
}
