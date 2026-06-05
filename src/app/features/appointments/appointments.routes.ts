import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/appointments-layout/appointments-layout.component').then(
        (m) => m.AppointmentsLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/appointments-shell/appointments-shell.component').then(
            (m) => m.AppointmentsShellComponent,
          ),
      },
      {
        path: 'firmar/:appointmentId',
        loadComponent: () =>
          import(
            './contract-signing/components/contract-signing-page/contract-signing-page.component'
          ).then((m) => m.ContractSigningPageComponent),
      },
    ],
  },
];
