import { Routes } from '@angular/router';

export const SURVEYS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/surveys-shell/surveys-shell.component').then(
        (m) => m.SurveysShellComponent,
      ),
  },
];
