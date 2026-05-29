import { inject, provideEnvironmentInitializer } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LoadingService } from './services/loading.service';

export function provideNavigationLoading() {
  return provideEnvironmentInitializer(() => {
    const router = inject(Router);
    const loading = inject(LoadingService);

    router.events
      .pipe(
        filter(
          (e) =>
            e instanceof NavigationStart ||
            e instanceof NavigationEnd ||
            e instanceof NavigationCancel ||
            e instanceof NavigationError,
        ),
      )
      .subscribe((e) => {
        if (e instanceof NavigationStart) {
          loading.begin('Cargando vista…');
        } else {
          loading.end();
        }
      });
  });
}
