import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { SKIP_GLOBAL_LOADING } from './loading.context';

function loadingMessageFor(req: HttpRequest<unknown>): string {
  const url = req.url.toLowerCase();
  const method = req.method.toUpperCase();

  if (url.includes('/login')) {
    return 'Iniciando sesión…';
  }
  if (method !== 'GET') {
    if (method === 'DELETE') {
      return 'Eliminando…';
    }
    if (url.includes('/appointment')) {
      return 'Guardando cita…';
    }
    if (url.includes('panel-user')) {
      return 'Guardando usuario…';
    }
    if (url.includes('/store')) {
      return 'Guardando tienda…';
    }
    if (url.includes('contract') || url.includes('template')) {
      return 'Guardando contrato…';
    }
    if (url.includes('survey') || url.includes('question')) {
      return 'Guardando pregunta…';
    }
    if (url.includes('customer')) {
      return 'Guardando cliente…';
    }
    return 'Guardando cambios…';
  }
  if (url.includes('stats') || url.includes('/report')) {
    return 'Cargando reporte…';
  }
  if (url.includes('survey') || url.includes('question')) {
    return 'Cargando encuestas…';
  }
  if (url.includes('appointment')) {
    return 'Cargando citas…';
  }
  if (url.includes('panel-user')) {
    return 'Cargando usuarios…';
  }
  if (url.includes('/store')) {
    return 'Cargando tiendas…';
  }
  if (url.includes('contract') || url.includes('template')) {
    return 'Cargando contratos…';
  }
  if (url.includes('customer')) {
    return 'Cargando clientes…';
  }
  return 'Cargando…';
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_GLOBAL_LOADING)) {
    return next(req);
  }

  const loading = inject(LoadingService);
  const message = loadingMessageFor(req);
  loading.begin(message);

  return next(req).pipe(finalize(() => loading.end()));
};
