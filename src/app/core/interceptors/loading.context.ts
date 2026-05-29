import { HttpContext, HttpContextToken } from '@angular/common/http';

/** Si es true, no muestra el loader global (p. ej. login con overlay propio). */
export const SKIP_GLOBAL_LOADING = new HttpContextToken<boolean>(() => false);

export function skipGlobalLoadingContext(): HttpContext {
  return new HttpContext().set(SKIP_GLOBAL_LOADING, true);
}
