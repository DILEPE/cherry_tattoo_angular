import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import {
  isDocumentCaptureAcceptable,
  readDocumentCaptureImage,
} from '../../models/signature.util';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-document-capture',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ctsig-capture">
      <span class="ctsig-capture__label">{{ label() }}</span>

      @if (previewUrl()) {
        <img class="ctsig-capture__preview" [src]="previewUrl()" alt="Foto del documento" />
        <p class="ctsig-capture__ready">Foto lista. Se verá al consultar el contrato firmado.</p>
      }

      <div class="ctsig-capture__actions">
        <label class="btn btn--primary ctsig-capture__pick">
          Abrir cámara
          <input
            type="file"
            accept="image/*"
            capture="environment"
            (change)="onFile($event)"
          />
        </label>
        <label class="btn btn--ghost ctsig-capture__pick">
          Elegir archivo
          <input type="file" accept="image/*" (change)="onFile($event)" />
        </label>
      </div>
    </div>
  `,
  styles: `
    .ctsig-capture {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface, #fff);
    }

    .ctsig-capture__label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .ctsig-capture__ready {
      margin: 0;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .ctsig-capture__preview {
      width: 100%;
      max-height: 180px;
      object-fit: contain;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: #111;
    }

    .ctsig-capture__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .ctsig-capture__pick {
      margin: 0;
    }

    .ctsig-capture__pick input {
      display: none;
    }
  `,
})
export class DocumentCaptureComponent {
  readonly label = input.required<string>();
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  private readonly toast = inject(ToastService);
  readonly previewUrl = signal<string | null>(null);

  private readonly _syncPreview = effect(() => {
    this.previewUrl.set(this.value());
  });

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    void readDocumentCaptureImage(file).then((url) => {
      if (!url || !isDocumentCaptureAcceptable(url)) {
        this.toast.warn('No se pudo usar esa imagen. Toma otra foto o elige un archivo de imagen.');
        return;
      }
      this.previewUrl.set(url);
      this.valueChange.emit(url);
      this.toast.success('Foto lista.');
    });
  }
}
