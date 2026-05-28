import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <strong>{{ title() }}</strong>
      <p>
        Módulo en migración desde Streamlit. La API Litestar ya está disponible; la UI Angular se
        completará en la siguiente iteración.
      </p>
    </div>
  `,
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = () => String(this.route.snapshot.data['title'] ?? 'Módulo');
}
