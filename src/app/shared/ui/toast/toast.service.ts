import { Injectable, inject } from '@angular/core';
import { UiStore } from '../../../store/ui.store';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly ui = inject(UiStore);

  success(message: string, duration = 4000): void {
    this.ui.showToast({ type: 'success', message, duration });
  }

  error(message: string, duration = 6000): void {
    this.ui.showToast({ type: 'error', message, duration });
  }

  info(message: string, duration = 4000): void {
    this.ui.showToast({ type: 'info', message, duration });
  }

  warn(message: string, duration = 5000): void {
    this.ui.showToast({ type: 'warning', message, duration });
  }
}
