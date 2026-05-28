import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../store/ui.store';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'toast-container', 'aria-live': 'polite', 'aria-atomic': 'false' },
  template: `
    @for (toast of ui.toasts(); track toast.id) {
      <div class="toast toast--{{ toast.type }}" role="status">
        <span>{{ toast.message }}</span>
        <button
          type="button"
          class="toast-close"
          (click)="ui.dismissToast(toast.id)"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    }
  `,
})
export class AppToastContainerComponent {
  protected readonly ui = inject(UiStore);
}
