import { Injectable, inject } from '@angular/core';
import { UiStore } from '../../store/ui.store';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly ui = inject(UiStore);
  private depth = 0;
  private message: string | null = null;

  begin(message = 'Cargando…'): void {
    this.depth += 1;
    this.message = message;
    this.sync();
  }

  end(): void {
    if (this.depth > 0) {
      this.depth -= 1;
    }
    if (this.depth === 0) {
      this.message = null;
    }
    this.sync();
  }

  /** Feedback breve para filtros u operaciones solo en cliente. */
  pulse(message = 'Aplicando filtros…'): void {
    this.begin(message);
    queueMicrotask(() => this.end());
  }

  async run<T>(message: string, fn: () => Promise<T>): Promise<T> {
    this.begin(message);
    try {
      return await fn();
    } finally {
      this.end();
    }
  }

  isActive(): boolean {
    return this.ui.globalLoading();
  }

  private sync(): void {
    const active = this.depth > 0;
    this.ui.setGlobalLoading(active, active ? this.message : null);
  }
}
