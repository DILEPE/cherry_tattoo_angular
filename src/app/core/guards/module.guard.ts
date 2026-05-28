import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStore } from '../../store/app.store';

/** Impide acceder a rutas de módulos no permitidos para el usuario. */
export function moduleGuard(moduleKey: string): CanActivateFn {
  return () => {
    const store = inject(AppStore);
    const router = inject(Router);
    if (store.canAccessModule(moduleKey)) {
      return true;
    }
    const first = store.allowedModuleKeys()[0];
    if (first) {
      return router.createUrlTree([`/${first}`]);
    }
    return router.createUrlTree(['/login']);
  };
}
