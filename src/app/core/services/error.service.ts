import { Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { apiErrorMessage } from './api.service';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly toast = inject(ToastService);

  handle(err: unknown, fallback = 'Ocurrió un error'): void {
    this.toast.error(apiErrorMessage(err) || fallback);
  }
}
