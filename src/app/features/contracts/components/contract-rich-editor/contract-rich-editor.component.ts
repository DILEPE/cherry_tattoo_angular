import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';
import { CONTRACT_PLACEHOLDER_CHIPS } from '../../models/contract-template.model';

const EDITOR_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link'],
  ['clean'],
];

@Component({
  selector: 'app-contract-rich-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContractRichEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="ct-rich-editor" [class.ct-rich-editor--disabled]="disabled()">
      <div class="ct-rich-editor__vars">
        <span class="ct-rich-editor__vars-label">Insertar variable</span>
        <div class="ct-rich-editor__vars-chips">
          @for (p of placeholders; track p.value) {
            <button
              type="button"
              class="ct-rich-editor__chip"
              [disabled]="disabled()"
              (click)="insertToken(p.value)"
            >
              {{ p.label }}
            </button>
          }
        </div>
      </div>
      <div class="ct-rich-editor__frame" [class.ct-rich-editor__frame--error]="showError()">
        <div #editorHost class="ct-rich-editor__host"></div>
      </div>
    </div>
  `,
})
export class ContractRichEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  readonly showError = input(false);

  protected readonly placeholders = CONTRACT_PLACEHOLDER_CHIPS;

  @ViewChild('editorHost', { static: true }) private readonly editorHost!: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private quill: Quill | null = null;
  private pendingHtml = '';
  private disabledState = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected disabled(): boolean {
    return this.disabledState;
  }

  ngAfterViewInit(): void {
    this.quill = new Quill(this.editorHost.nativeElement, {
      theme: 'snow',
      modules: { toolbar: EDITOR_TOOLBAR },
      placeholder: 'Redacta aquí el texto del contrato…',
    });

    if (this.pendingHtml) {
      this.quill.clipboard.dangerouslyPasteHTML(this.pendingHtml);
    }
    this.syncDisabled();

    this.quill.on('text-change', () => {
      this.onChange(this.readHtml());
    });
    this.quill.on('selection-change', (range, _old, source) => {
      if (source === 'user' && range) {
        this.onTouched();
      }
    });
  }

  ngOnDestroy(): void {
    this.quill = null;
  }

  writeValue(value: string | null): void {
    const html = value ?? '';
    if (!this.quill) {
      this.pendingHtml = html;
      return;
    }
    if (this.readHtml() !== html) {
      const sel = this.quill.getSelection();
      this.quill.clipboard.dangerouslyPasteHTML(html || '');
      if (sel) {
        this.quill.setSelection(sel);
      }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState = isDisabled;
    this.syncDisabled();
    this.cdr.markForCheck();
  }

  insertToken(token: string): void {
    if (!this.quill || this.disabledState) return;
    const range = this.quill.getSelection(true);
    const index = range?.index ?? Math.max(0, this.quill.getLength() - 1);
    this.quill.insertText(index, token, 'user');
    this.quill.setSelection(index + token.length, 0);
    this.onTouched();
    this.onChange(this.readHtml());
  }

  private readHtml(): string {
    if (!this.quill) return '';
    const text = this.quill.getText().replace(/\u00a0/g, ' ').trim();
    if (!text) return '';
    return this.quill.root.innerHTML;
  }

  private syncDisabled(): void {
    if (!this.quill) return;
    this.quill.enable(!this.disabledState);
  }
}
