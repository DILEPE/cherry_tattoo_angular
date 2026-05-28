import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/appointments-shell/appointments-shell.component').then(
        (m) => m.AppointmentsShellComponent,
      ),
  },
];
