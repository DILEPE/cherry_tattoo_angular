import { Routes } from '@angular/router';
import { moduleGuard } from '../../core/guards/module.guard';
import { PanelShellComponent } from './components/panel-shell/panel-shell.component';

export const SHELL_ROUTES: Routes = [
  {
    path: '',
    component: PanelShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'citas' },
      {
        path: 'citas',
        canActivate: [moduleGuard('citas')],
        loadChildren: () =>
          import('../appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
      },
      {
        path: 'clientes',
        canActivate: [moduleGuard('clientes')],
        loadChildren: () =>
          import('../customers/customers.routes').then((m) => m.CUSTOMERS_ROUTES),
      },
      {
        path: 'contratos',
        canActivate: [moduleGuard('contratos')],
        loadChildren: () =>
          import('../contracts/contracts.routes').then((m) => m.CONTRACTS_ROUTES),
      },
      {
        path: 'encuestas',
        canActivate: [moduleGuard('encuestas')],
        loadChildren: () =>
          import('../surveys/surveys.routes').then((m) => m.SURVEYS_ROUTES),
      },
      {
        path: 'reporte',
        canActivate: [moduleGuard('reporte')],
        loadChildren: () =>
          import('../report/report.routes').then((m) => m.REPORT_ROUTES),
      },
      {
        path: 'tiendas',
        canActivate: [moduleGuard('tiendas')],
        loadComponent: () =>
          import('./components/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Gestión de tiendas' },
      },
      {
        path: 'usuarios_panel',
        canActivate: [moduleGuard('usuarios_panel')],
        loadChildren: () =>
          import('../panel-users/panel-users.routes').then((m) => m.PANEL_USERS_ROUTES),
      },
    ],
  },
];
