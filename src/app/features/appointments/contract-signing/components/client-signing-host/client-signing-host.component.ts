import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppointmentsStore } from '../../../appointments.store';
import { AppointmentDialogStore } from '../../../appointment-dialog.store';
import { ContractSigningPageComponent } from '../contract-signing-page/contract-signing-page.component';

/** Host de firma para el rol cliente: aporta los stores de citas fuera del panel. */
@Component({
  selector: 'app-client-signing-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AppointmentsStore, AppointmentDialogStore],
  imports: [ContractSigningPageComponent],
  template: `<app-contract-signing-page />`,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class ClientSigningHostComponent {}
