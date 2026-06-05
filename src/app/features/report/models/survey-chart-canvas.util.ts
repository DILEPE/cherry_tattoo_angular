import {
  SurveyChartEntry,
  SurveyChartVariant,
  surveyChartColor,
  surveyChartTotal,
  truncateSurveyChartLabel,
} from './survey-chart.util';

const FONT = 'Calibri, Segoe UI, sans-serif';
const DPR = 2;

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shadeHex(hex: string, amount: number): string {
  const { r, g, b } = parseHexColor(hex);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v + amount)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function fillArcRelief(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
  baseColor: string,
): void {
  const mid = (start + end) / 2;
  const gx = cx + Math.cos(mid) * r * 0.35;
  const gy = cy + Math.sin(mid) * r * 0.35;
  const grad = ctx.createRadialGradient(gx, gy, r * 0.05, cx, cy, r);
  grad.addColorStop(0, shadeHex(baseColor, 48));
  grad.addColorStop(0.5, baseColor);
  grad.addColorStop(1, shadeHex(baseColor, -42));
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, start, end);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = shadeHex(baseColor, -55);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.stroke();
}

function setupCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * DPR);
  canvas.height = Math.round(height * DPR);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(DPR, DPR);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx, w: width, h: height };
}

function entryPct(entry: SurveyChartEntry, total: number): string {
  if (total <= 0) return '0.0';
  return ((entry.count / total) * 100).toFixed(1);
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, w: number): void {
  ctx.fillStyle = '#111827';
  ctx.font = `700 14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateSurveyChartLabel(title, 72), 16, 12);
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(16, 34);
  ctx.lineTo(w - 16, 34);
  ctx.stroke();
}

function drawPie(ctx: CanvasRenderingContext2D, entries: SurveyChartEntry[], w: number, h: number): void {
  const total = surveyChartTotal(entries);
  const cx = 150;
  const cy = h / 2 + 8;
  const r = Math.min(108, (h - 56) / 2);

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.92, r * 0.88, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  let start = -Math.PI / 2;
  entries.forEach((e, i) => {
    const slice = (e.count / total) * Math.PI * 2;
    const color = surveyChartColor(i);
    ctx.save();
    ctx.translate(2.5, 3.5);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = shadeHex(color, -70);
    ctx.fill();
    ctx.restore();
    fillArcRelief(ctx, cx, cy, r, start, start + slice, color);
    start += slice;
  });

  const wellR = r * 0.42;
  const wellGrad = ctx.createRadialGradient(cx, cy - wellR * 0.25, wellR * 0.1, cx, cy, wellR);
  wellGrad.addColorStop(0, '#f8fafc');
  wellGrad.addColorStop(0.55, '#e2e8f0');
  wellGrad.addColorStop(1, '#94a3b8');
  ctx.beginPath();
  ctx.arc(cx, cy, wellR, 0, Math.PI * 2);
  ctx.fillStyle = wellGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const gloss = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.35, 0, cx, cy, r);
  gloss.addColorStop(0, 'rgba(255,255,255,0.38)');
  gloss.addColorStop(0.45, 'rgba(255,255,255,0.08)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gloss;
  ctx.fill();

  let angleDeg = -90;
  entries.forEach((e) => {
    const fraction = e.count / total;
    const sweep = fraction * 360;
    const midDeg = angleDeg + sweep / 2;
    angleDeg += sweep;
    if (fraction < 0.05 && !(entries.length <= 6 && fraction > 0)) return;
    const rad = (midDeg * Math.PI) / 180;
    const lx = cx + r * 0.52 * Math.cos(rad);
    const ly = cy + r * 0.52 * Math.sin(rad);
    const pct = `${(fraction * 100).toFixed(1)}%`;
    ctx.font = `800 11px ${FONT}`;
    const tw = ctx.measureText(pct).width;
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fillRect(lx - tw / 2 - 4, ly - 8, tw + 8, 16);
    ctx.strokeStyle = 'rgba(15,23,42,0.15)';
    ctx.strokeRect(lx - tw / 2 - 4, ly - 8, tw + 8, 16);
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pct, lx, ly);
  });

  let ly = 48;
  const legendX = 300;
  entries.forEach((e, i) => {
    const color = surveyChartColor(i);
    ctx.fillStyle = shadeHex(color, 35);
    ctx.fillRect(legendX, ly, 12, 5);
    ctx.fillStyle = color;
    ctx.fillRect(legendX, ly + 4, 12, 5);
    ctx.fillStyle = shadeHex(color, -30);
    ctx.fillRect(legendX, ly + 9, 12, 3);
    ctx.fillStyle = '#374151';
    ctx.font = `600 11px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(truncateSurveyChartLabel(e.key, 42), legendX + 18, ly);
    ctx.font = `400 10px ${FONT}`;
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${e.count} (${entryPct(e, total)}%)`, legendX + 18, ly + 14);
    ly += 34;
  });
}

function drawBars(ctx: CanvasRenderingContext2D, entries: SurveyChartEntry[], w: number, h: number): void {
  const total = surveyChartTotal(entries);
  const left = 128;
  const right = 52;
  const trackW = w - left - right;
  const barH = 26;
  const gap = 10;
  let y = 48;

  entries.forEach((e, i) => {
    ctx.fillStyle = '#6b7280';
    ctx.font = `500 10px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncateSurveyChartLabel(e.key, 20), left - 10, y + barH / 2);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(left, y, trackW, barH);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(left, y + 1, trackW, barH - 2);

    const fillW = total > 0 ? Math.max(2, (e.count / total) * trackW) : 0;
    const color = surveyChartColor(i);
    const barGrad = ctx.createLinearGradient(left, y, left, y + barH);
    barGrad.addColorStop(0, shadeHex(color, 42));
    barGrad.addColorStop(0.45, color);
    barGrad.addColorStop(1, shadeHex(color, -38));
    ctx.fillStyle = barGrad;
    ctx.fillRect(left + 1, y + 2, Math.max(0, fillW - 2), barH - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(left + 1, y + 2, Math.max(0, fillW - 2), 3);
    ctx.strokeStyle = shadeHex(color, -50);
    ctx.lineWidth = 0.6;
    ctx.strokeRect(left + 1, y + 2, Math.max(0, fillW - 2), barH - 4);

    const pct = `${entryPct(e, total)}%`;
    ctx.font = `800 10px ${FONT}`;
    if (fillW >= trackW * 0.18) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(pct, left + fillW - 6, y + barH / 2);
    } else {
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      ctx.fillText(pct, left + fillW + 6, y + barH / 2);
    }

    ctx.fillStyle = '#111827';
    ctx.font = `700 10px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(String(e.count), w - 12, y + barH / 2);

    y += barH + gap;
  });
}

export function renderSurveyChartPngBase64(
  entries: SurveyChartEntry[],
  variant: SurveyChartVariant,
  title: string,
): string | null {
  if (!entries.length || surveyChartTotal(entries) <= 0) return null;

  const barH = variant === 'bar' ? 48 + entries.length * 36 : 320;
  const w = 520;
  const h = variant === 'bar' ? Math.max(180, barH) : 320;
  const { canvas, ctx } = setupCanvas(w, h);

  drawTitle(ctx, title, w);
  if (variant === 'bar') drawBars(ctx, entries, w, h);
  else drawPie(ctx, entries, w, h);

  return canvas.toDataURL('image/png').split(',')[1] ?? null;
}

export function downloadPngBase64(base64: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = `data:image/png;base64,${base64}`;
  anchor.download = filename;
  anchor.click();
}

export function surveyChartPngFilename(questionLabel: string, questionId: number): string {
  const slug = String(questionLabel ?? 'pregunta')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36);
  return `encuesta-${questionId}-${slug || 'grafica'}.png`;
}
