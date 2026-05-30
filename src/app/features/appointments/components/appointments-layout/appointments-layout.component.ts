import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppointmentsStore } from '../../appointments.store';
import { AppointmentDialogStore } from '../../appointment-dialog.store';

/** Contenedor con stores compartidos entre agenda y firma de contrato. */
@Component({
  selector: 'app-appointments-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AppointmentsStore, AppointmentDialogStore],
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppointmentsLayoutComponent {}
