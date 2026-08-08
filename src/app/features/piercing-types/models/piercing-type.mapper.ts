import { PiercingTypeDetail, PiercingTypeRow } from './piercing-type.model';

export function mapPiercingTypeRow(raw: Record<string, unknown>): PiercingTypeRow | null {
  const label = String(raw['survey_option_label'] ?? '').trim();
  if (!label) return null;
  const updated = raw['updated_at'];
  return {
    label,
    sourceFilename: String(raw['source_filename'] ?? `${label}.pdf`).trim() || `${label}.pdf`,
    updatedAt: updated == null ? null : String(updated),
    pdfBytes: Number(raw['pdf_bytes'] ?? 0) || 0,
    isTattoo: Boolean(raw['is_tattoo']) || label.toLowerCase() === 'tatuaje',
  };
}

export function mapPiercingTypeDetail(raw: Record<string, unknown>): PiercingTypeDetail | null {
  const row = mapPiercingTypeRow(raw);
  if (!row) return null;
  return {
    ...row,
    pdfBase64: String(raw['pdf_base64'] ?? '').trim(),
  };
}

export function formatPdfSize(bytes: number): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
