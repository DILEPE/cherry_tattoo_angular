import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStore } from '../../store/app.store';
import { isClientRole } from '../utils/panel-roles';

export const authGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const router = inject(Router);
  if (store.ensureSessionValid()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const router = inject(Router);
  if (!store.isAuthenticated()) {
    return true;
  }
  if (isClientRole(store.user()?.role ?? '')) {
    return router.createUrlTree(['/cliente']);
  }
  return router.createUrlTree(['/citas']);
};

/** Panel operativo: no deja entrar a un cliente con código OTP. */
export const staffGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const router = inject(Router);
  if (!store.ensureSessionValid()) {
    return router.createUrlTree(['/login']);
  }
  if (isClientRole(store.user()?.role ?? '')) {
    return router.createUrlTree(['/cliente']);
  }
  return true;
};

/** Tableta de firma: solo rol cliente con cita asociada al OTP. */
export const clientGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const router = inject(Router);
  if (!store.ensureSessionValid()) {
    return router.createUrlTree(['/login']);
  }
  const u = store.user();
  if (u && !isClientRole(u.role)) {
    return router.createUrlTree(['/citas']);
  }
  if (!u || !isClientRole(u.role) || !(u.appointmentId ?? 0)) {
    return router.createUrlTree(['/login']);
  }
  return true;
};
