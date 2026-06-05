import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export interface ApiErrorBody {
  detail?: string | unknown;
  message?: string;
}

export interface ApiRequestOptions {
  context?: HttpContext;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /** Vacío en dev (`ng serve` + proxy); en prod definir `window.__CHERRY_API_BASE__`. */
  readonly baseUrl = (() => {
    const env = (globalThis as { __CHERRY_API_BASE__?: string }).__CHERRY_API_BASE__;
    if (env !== undefined) return env.replace(/\/$/, '');
    return '';
  })();

  get<T>(
    path: string,
    params?: Record<string, string | number | boolean> | null,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http
      .get<T>(this.url(path), {
        params: this.toParams(params ?? undefined),
        context: options?.context,
      })
      .pipe(catchError((e) => throwError(() => this.normalizeError(e))));
  }

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .post<T>(this.url(path), body ?? {}, { context: options?.context })
      .pipe(catchError((e) => throwError(() => this.normalizeError(e))));
  }

  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .patch<T>(this.url(path), body ?? {}, { context: options?.context })
      .pipe(catchError((e) => throwError(() => this.normalizeError(e))));
  }

  put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .put<T>(this.url(path), body ?? {}, { context: options?.context })
      .pipe(catchError((e) => throwError(() => this.normalizeError(e))));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.url(path), { context: options?.context })
      .pipe(catchError((e) => throwError(() => this.normalizeError(e))));
  }

  getBlob(path: string, options?: ApiRequestOptions): Observable<Blob> {
    return this.http
      .get(this.url(path), { responseType: 'blob', context: options?.context })
      .pipe(catchError((e) => throwError(() => this.normalizeError(e))));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private toParams(
    params?: Record<string, string | number | boolean>,
  ): HttpParams | undefined {
    if (!params) return undefined;
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    return hp;
  }

  private normalizeError(err: unknown): { status: number; message: string; raw: unknown } {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as ApiErrorBody | string | null;
      let message = `HTTP ${err.status}`;
      if (typeof body === 'string' && body) {
        message = body;
      } else if (body && typeof body === 'object') {
        if (typeof body.message === 'string') message = body.message;
        else if (typeof body.detail === 'string') message = body.detail;
        else if (body.detail) message = JSON.stringify(body.detail);
      }
      return { status: err.status, message, raw: err.error };
    }
    return {
      status: 0,
      message: 'No se pudo conectar con el servidor. Comprueba que la API esté en ejecución.',
      raw: err,
    };
  }
}

/** Extrae mensaje legible de errores del ApiService. */
export function apiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Error inesperado';
}
