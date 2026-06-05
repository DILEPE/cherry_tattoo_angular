import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/report-shell/report-shell.component').then(
        (m) => m.ReportShellComponent,
      ),
  },
];
