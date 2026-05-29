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
        loadComponent: () =>
          import('./components/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Gestión de clientes' },
      },
      {
        path: 'contratos',
        canActivate: [moduleGuard('contratos')],
        loadComponent: () =>
          import('./components/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Gestión contratos' },
      },
      {
        path: 'encuestas',
        canActivate: [moduleGuard('encuestas')],
        loadComponent: () =>
          import('./components/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Gestión encuesta' },
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
        loadComponent: () =>
          import('./components/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Gestión de usuarios' },
      },
    ],
  },
];
