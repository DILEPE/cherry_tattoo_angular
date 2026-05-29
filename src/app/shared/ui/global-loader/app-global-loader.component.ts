import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../../store/ui.store';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.globalLoading()) {
      <div class="global-loader" role="status" aria-live="polite" aria-busy="true">
        <div class="global-loader__panel">
          <span class="global-loader__spinner" aria-hidden="true"></span>
          <span class="global-loader__text">{{ ui.loadingMessage() ?? 'Cargando…' }}</span>
        </div>
      </div>
    }
  `,
})
export class AppGlobalLoaderComponent {
  protected readonly ui = inject(UiStore);
}
