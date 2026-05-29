import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentsStore } from '../../appointments.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

@Component({
  selector: 'app-calendar-goto-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent],
  template: `
    <div class="cal-goto-row">
      <label>
        Fecha
        <input
          type="date"
          [ngModel]="store.gotoDateIso()"
          (ngModelChange)="store.setGotoDateIso($event)"
        />
      </label>
      <app-button variant="ghost" (clicked)="store.goToSelectedWeek()">Ir a fecha</app-button>
      <span class="cal-goto-hint">Abre la agenda en vista Semana para el día elegido.</span>
    </div>
  `,
})
export class CalendarGotoRowComponent {
  protected readonly store = inject(AppointmentsStore);
}
