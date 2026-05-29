import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      class="btn btn--{{ variant() }}"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit()"
    >
      @if (loading()) {
        <span class="btn__spinner" aria-hidden="true"></span>
        <span class="sr-only">Cargando…</span>
      }
      <ng-content />
    </button>
  `,
  styles: [`:host { display: inline-block; }`],
})
export class AppButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly clicked = output<void>();
}
