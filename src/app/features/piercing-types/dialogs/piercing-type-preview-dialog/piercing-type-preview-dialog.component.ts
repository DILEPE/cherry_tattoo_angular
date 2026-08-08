import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PiercingTypesApiService } from '../../services/piercing-types-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { ErrorService } from '../../../../core/services/error.service';
import { PiercingTypeModalData } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-type-preview-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, AppSkeletonComponent],
  template: `
    @if (loading()) {
      <app-skeleton [rows]="4" />
    } @else if (error()) {
      <p class="form-field__error">{{ error() }}</p>
      <div class="appt-dialog-actions">
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      </div>
    } @else if (pdfUrl()) {
      <p class="pt-preview-meta">{{ filename }}</p>
      <div class="pt-preview-frame-wrap">
        <iframe
          class="pt-preview-frame"
          title="Vista previa del PDF de cuidados"
          [src]="pdfUrl()"
        ></iframe>
      </div>
      <div class="appt-dialog-actions pt-preview-actions">
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      </div>
    }
  `,
})
export class PiercingTypePreviewDialogComponent implements OnInit, OnDestroy {
  private readonly api = inject(PiercingTypesApiService);
  private readonly ui = inject(UiStore);
  private readonly errors = inject(ErrorService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);

  readonly label: string;
  filename = '';
  private objectUrl: string | null = null;

  constructor() {
    const data = (this.ui.activeModal()?.data ?? {}) as PiercingTypeModalData;
    this.label = String(data.label ?? '').trim();
    this.filename = String(data.sourceFilename ?? '').trim();
  }

  ngOnInit(): void {
    if (!this.label) {
      this.loading.set(false);
      this.error.set('No se indicó el tipo de piercing.');
      return;
    }
    this.api.getDetail(this.label).subscribe({
      next: (detail) => {
        this.loading.set(false);
        this.filename = detail.sourceFilename || this.filename || `${this.label}.pdf`;
        try {
          this.setPdfFromBase64(detail.pdfBase64);
        } catch {
          this.error.set('No se pudo preparar la vista previa del PDF.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el PDF.');
        this.errors.handle(err);
      },
    });
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  close(): void {
    this.ui.closeModal();
  }

  private setPdfFromBase64(b64: string): void {
    const clean = (b64 || '').trim();
    if (!clean) {
      this.error.set('Este tipo no tiene PDF guardado.');
      return;
    }
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(blob);
    this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
