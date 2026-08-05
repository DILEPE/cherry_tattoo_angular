import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { UiStore } from '../../../store/ui.store';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop"
        (click)="onBackdropClick($event)"
        role="dialog"
        [attr.aria-label]="title()"
        aria-modal="true"
      >
        <div
          class="modal-container modal-container--{{ size() }}"
          [class.modal-container--busy]="busy()"
        >
          @if (busy()) {
            <div class="modal-busy" role="status" aria-live="polite" aria-busy="true">
              <span class="modal-busy__spinner" aria-hidden="true"></span>
              <span class="modal-busy__text">{{ busyMessage() }}</span>
            </div>
          }
          <header class="modal-header">
            <div class="modal-header__main">
              <h2>{{ title() }}</h2>
              @if (subtitle()) {
                <p class="modal-header__subtitle">
                  <span class="modal-header__subtitle-label">{{ subtitleLabel() }}</span>
                  <strong class="modal-header__subtitle-value">{{ subtitle() }}</strong>
                </p>
              }
            </div>
            <div class="modal-header__aside">
              <ng-content select="[modalHeaderEnd]" />
              @if (dismissible()) {
                <button type="button" class="modal-close" (click)="close()" aria-label="Cerrar">
                  ×
                </button>
              }
            </div>
          </header>
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class AppModalComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly subtitleLabel = input('Fecha de creación');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly dismissible = input(true);
  readonly isOpen = input(true);
  readonly busy = input(false);
  readonly busyMessage = input('Cargando…');
  readonly closed = output<void>();

  protected readonly ui = inject(UiStore);

  onBackdropClick(e: MouseEvent): void {
    if (this.dismissible() && e.target === e.currentTarget) {
      this.close();
    }
  }

  close(): void {
    this.ui.closeModal();
    this.closed.emit();
  }
}
