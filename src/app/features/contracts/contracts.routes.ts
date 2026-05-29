import { Routes } from '@angular/router';

export const CONTRACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/contracts-shell/contracts-shell.component').then(
        (m) => m.ContractsShellComponent,
      ),
  },
];
