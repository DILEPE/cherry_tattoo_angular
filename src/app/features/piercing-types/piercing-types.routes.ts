import { Routes } from '@angular/router';

export const PIERCING_TYPES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/piercing-types-shell/piercing-types-shell.component').then(
        (m) => m.PiercingTypesShellComponent,
      ),
  },
];
