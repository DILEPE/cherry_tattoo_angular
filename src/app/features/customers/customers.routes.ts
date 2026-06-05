import { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/customers-shell/customers-shell.component').then(
        (m) => m.CustomersShellComponent,
      ),
  },
];
