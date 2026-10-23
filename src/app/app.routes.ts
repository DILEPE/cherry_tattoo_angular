import { Routes } from '@angular/router';
import { authGuard, clientGuard, guestGuard, staffGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cliente',
    canActivate: [clientGuard],
    loadComponent: () =>
      import(
        './features/appointments/contract-signing/components/client-signing-host/client-signing-host.component'
      ).then((m) => m.ClientSigningHostComponent),
  },
  {
    path: '',
    canActivate: [authGuard, staffGuard],
    loadChildren: () => import('./features/shell/shell.routes').then((m) => m.SHELL_ROUTES),
  },
  { path: '**', redirectTo: 'citas' },
];
