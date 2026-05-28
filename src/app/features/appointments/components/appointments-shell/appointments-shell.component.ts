import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component';
import { UiStore } from '../../../../store/ui.store';
import { AppModalComponent } from '../../../../shared/ui/modal/app-modal.component';

@Component({
  selector: 'app-appointments-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AppointmentsStore],
  imports: [AppointmentsListComponent, AppModalComponent],
  template: `
    <app-appointments-list />

    @switch (ui.activeModal()?.id) {
      @case ('appointment-detail') {
        @defer (on immediate) {
          <app-modal title="Detalle de cita" size="md" [isOpen]="true">
            <p>Calendario, agendar y diálogos avanzados: próxima iteración.</p>
            <p>ID cita: {{ ui.activeModal()?.data }}</p>
          </app-modal>
        } @loading {
          <p>Cargando…</p>
        }
      }
    }
  `,
})
export class AppointmentsShellComponent {
  protected readonly store = inject(AppointmentsStore);
  protected readonly ui = inject(UiStore);

  private readonly _loadEffect = effect(() => {
    this.store.reloadToken();
    this.store.load();
  });
}
