import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { PiercingTypeWritePayload } from '../../models/piercing-type.model';

@Component({
  selector: 'app-piercing-type-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppButtonComponent],
  template: `
    <form class="pt-form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <label class="pt-field">
        <span>Nombre del tipo *</span>
        <input type="text" formControlName="label" maxlength="191" placeholder="Ej. Helix" />
      </label>

      <label class="pt-field">
        <span>Nombre del archivo PDF</span>
        <input type="text" formControlName="sourceFilename" maxlength="255" placeholder="Helix.pdf" />
      </label>

      <div class="pt-field">
        <span>{{ requirePdf() ? 'PDF de cuidados *' : 'Reemplazar PDF (opcional)' }}</span>
        <div class="pt-file-row">
          <input
            #fileInput
            type="file"
            accept="application/pdf,.pdf"
            class="pt-file-input"
            (change)="onFile($event)"
          />
          <app-button type="button" variant="ghost" (clicked)="pickFile()">
            Elegir PDF
          </app-button>
          <span class="pt-file-name">{{ fileName() || 'Ningún archivo' }}</span>
        </div>
        @if (fileError()) {
          <p class="form-field__error">{{ fileError() }}</p>
        }
      </div>

      <ng-content select="[actions]" />
    </form>
  `,
})
export class PiercingTypeFormComponent implements AfterViewInit {
  readonly initialLabel = input('');
  readonly initialFilename = input('');
  readonly requirePdf = input(true);
  readonly submitted = output<PiercingTypeWritePayload & { pdfOptional: boolean }>();

  private readonly fb = inject(FormBuilder);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly fileName = signal('');
  readonly fileError = signal<string | null>(null);
  private pdfBase64: string | null = null;

  readonly form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(191)]],
    sourceFilename: ['', [Validators.maxLength(255)]],
  });

  ngAfterViewInit(): void {
    this.hydrate();
  }

  hydrate(): void {
    const label = this.initialLabel().trim();
    const fname = this.initialFilename().trim();
    this.form.patchValue({
      label,
      sourceFilename: fname || (label ? `${label}.pdf` : ''),
    });
    this.fileName.set('');
    this.fileError.set(null);
    this.pdfBase64 = null;
  }

  pickFile(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFile(ev: Event): void {
    const inputEl = ev.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    this.fileError.set(null);
    this.pdfBase64 = null;
    this.fileName.set('');
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') {
      this.fileError.set('Solo se admiten archivos PDF.');
      inputEl.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.fileError.set('El PDF no puede superar 8 MB.');
      inputEl.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const marker = 'base64,';
      const idx = result.indexOf(marker);
      const b64 = idx >= 0 ? result.slice(idx + marker.length) : result;
      if (!b64) {
        this.fileError.set('No se pudo leer el PDF.');
        return;
      }
      this.pdfBase64 = b64;
      this.fileName.set(file.name);
      if (!this.form.controls.sourceFilename.value.trim()) {
        this.form.controls.sourceFilename.setValue(file.name);
      }
    };
    reader.onerror = () => this.fileError.set('No se pudo leer el PDF.');
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.requirePdf() && !this.pdfBase64) {
      this.fileError.set('Selecciona el PDF de cuidados.');
      return;
    }
    if (this.fileError()) return;
    const label = this.form.controls.label.value.trim();
    let fname = this.form.controls.sourceFilename.value.trim() || `${label}.pdf`;
    if (!fname.toLowerCase().endsWith('.pdf')) fname = `${fname}.pdf`;
    this.submitted.emit({
      survey_option_label: label,
      source_filename: fname,
      pdf_base64: this.pdfBase64 || '',
      pdfOptional: !this.requirePdf(),
    });
  }
}
