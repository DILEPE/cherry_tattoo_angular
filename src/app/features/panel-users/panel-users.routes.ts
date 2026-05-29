import { Routes } from '@angular/router';

export const PANEL_USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/panel-users-shell/panel-users-shell.component').then(
        (m) => m.PanelUsersShellComponent,
      ),
  },
];
