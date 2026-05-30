import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AppButtonComponent } from '../button/app-button.component';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent],
  template: `
    <div class="sig-pad">
      <p class="sig-pad__label">{{ label() }}</p>
      <canvas
        #canvas
        class="sig-pad__canvas"
        [attr.width]="width()"
        [attr.height]="height()"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointerleave)="onPointerUp($event)"
        (pointercancel)="onPointerUp($event)"
      ></canvas>
      <div class="sig-pad__actions">
        <app-button type="button" variant="ghost" (clicked)="clear()">Limpiar</app-button>
      </div>
    </div>
  `,
})
export class AppSignaturePadComponent implements AfterViewInit, OnDestroy {
  readonly label = input('Firma');
  readonly width = input(620);
  readonly height = input(180);

  readonly valueChange = output<string | null>();

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private hasStroke = signal(false);
  private ro: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.initCanvas();
    const el = this.canvasRef()?.nativeElement;
    if (el && typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.initCanvas());
      this.ro.observe(el.parentElement ?? el);
    }
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  clear(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.ctx) return;
    this.ctx.fillStyle = '#f8f8f3';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.hasStroke.set(false);
    this.valueChange.emit(null);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.min(this.width(), canvas.parentElement?.clientWidth ?? this.width());
    const cssH = this.height();
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#222';
    ctx.fillStyle = '#f8f8f3';
    ctx.fillRect(0, 0, cssW, cssH);
    this.ctx = ctx;
  }

  private canvasPoint(e: PointerEvent): { x: number; y: number } | null {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  onPointerDown(e: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const p = this.canvasPoint(e);
    if (!p) return;
    this.drawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.drawing || !this.ctx) return;
    const p = this.canvasPoint(e);
    if (!p) return;
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
    this.hasStroke.set(true);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (this.hasStroke()) {
      this.valueChange.emit(canvas.toDataURL('image/png'));
    }
  }
}
