import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AppButtonComponent } from '../../../../../shared/ui/button/app-button.component';
import {
  isDocumentCaptureAcceptable,
  readImageFileAsDataUrl,
} from '../../models/signature.util';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-document-capture',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <div class="ctsig-capture">
      <span class="ctsig-capture__label">{{ label() }}</span>

      @if (previewUrl()) {
        <img class="ctsig-capture__preview" [src]="previewUrl()!" [alt]="label()" />
      }

      @if (cameraOpen()) {
        <div class="ctsig-capture__camera">
          <video #videoEl class="ctsig-capture__video" autoplay playsinline muted></video>
          <canvas #canvasEl class="ctsig-capture__canvas" hidden></canvas>
          <div class="ctsig-capture__actions">
            <app-button variant="primary" (clicked)="snap()">Capturar foto</app-button>
            <app-button variant="ghost" (clicked)="stopCamera()">Cerrar cámara</app-button>
          </div>
        </div>
      } @else {
        <div class="ctsig-capture__actions">
          <app-button variant="primary" [loading]="starting()" (clicked)="openCamera()">
            Abrir cámara
          </app-button>
          <label class="ctsig-capture__file-btn">
            Elegir archivo
            <input type="file" accept="image/*" (change)="onFile($event)" />
          </label>
        </div>
      }

      @if (cameraError()) {
        <p class="form-field__error">{{ cameraError() }}</p>
      }
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
      font-weight: 600;
    }

    .ctsig-capture__preview,
    .ctsig-capture__video {
      width: 100%;
      max-height: 220px;
      object-fit: contain;
      border-radius: var(--radius-sm);
      background: #111;
      border: 1px solid var(--border);
    }

    .ctsig-capture__camera {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ctsig-capture__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .ctsig-capture__file-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.25rem;
      padding: 0.4rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      background: #fff;
    }

    .ctsig-capture__file-btn input {
      display: none;
    }
  `,
})
export class DocumentCaptureComponent implements OnDestroy {
  readonly label = input.required<string>();
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  private readonly toast = inject(ToastService);
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoEl');
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvasEl');

  readonly previewUrl = signal<string | null>(null);
  readonly cameraOpen = signal(false);
  readonly starting = signal(false);
  readonly cameraError = signal<string | null>(null);

  private stream: MediaStream | null = null;

  private readonly _syncPreview = effect(() => {
    this.previewUrl.set(this.value());
  });

  private readonly _bindVideo = effect(() => {
    if (!this.cameraOpen() || !this.stream) return;
    const video = this.videoRef()?.nativeElement;
    if (!video) return;
    if (video.srcObject !== this.stream) {
      video.srcObject = this.stream;
      void video.play().catch(() => undefined);
    }
  });

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async openCamera(): Promise<void> {
    this.cameraError.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set(
        'Este navegador no permite cámara. Usa «Elegir archivo» o prueba en el celular.',
      );
      return;
    }
    this.starting.set(true);
    try {
      this.stopCamera();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      this.cameraOpen.set(true);
    } catch {
      this.cameraError.set(
        'No se pudo abrir la cámara. Revisa permisos del navegador o usa «Elegir archivo».',
      );
      this.cameraOpen.set(false);
    } finally {
      this.starting.set(false);
    }
  }

  snap(): void {
    const video = this.videoRef()?.nativeElement;
    const canvas = this.canvasRef()?.nativeElement;
    if (!video || !canvas || !video.videoWidth) {
      this.toast.warn('Espera a que la cámara cargue y vuelve a intentar.');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    if (!isDocumentCaptureAcceptable(dataUrl)) {
      this.toast.warn('No se pudo capturar la foto. Intenta de nuevo.');
      return;
    }
    this.previewUrl.set(dataUrl);
    this.valueChange.emit(dataUrl);
    this.stopCamera();
    this.toast.success('Foto capturada.');
  }

  stopCamera(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    const video = this.videoRef()?.nativeElement;
    if (video) video.srcObject = null;
    this.cameraOpen.set(false);
  }

  onFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void readImageFileAsDataUrl(file).then((url) => {
      if (!url) {
        this.toast.warn('El archivo no es una imagen válida.');
        return;
      }
      this.previewUrl.set(url);
      this.valueChange.emit(url);
    });
  }
}
