/** Catálogo de tipos anatómicos de piercing (paridad con `piercing_procedure_labels.py`). */

import { Appointment } from './appointment.model';
import { inferWorkKindFromAppointment } from './booking.mapper';

export const PIERCING_TYPE_OPTIONS = [
  'Helix',
  'Lobulos',
  'Expansion Lobulos',
  'Nostril',
  'Surface',
  'Microdermal',
  'Septum',
  'Labio',
  'Ombligo',
  'Pezon',
  'Ceja',
  'Conch',
  'Industrial',
  'Upper Lobe',
  'Tragus',
  'Lengua',
  'Cristina',
  'Daith',
  'Rook',
  'Antihelix',
  'Contrahelix',
  'Flat',
] as const;

export type PiercingTypeCanonical = (typeof PIERCING_TYPE_OPTIONS)[number];

export const PIERCING_TYPE_DISPLAY_ES: Record<string, string> = {
  Helix: 'Helix',
  Lobulos: 'Lóbulo',
  'Expansion Lobulos': 'Expansión lóbulos',
  Nostril: 'Nostril',
  Surface: 'Surface',
  Microdermal: 'Microdermal',
  Septum: 'Septum',
  Labio: 'Labio',
  Ombligo: 'Ombligo',
  Pezon: 'Pezón',
  Ceja: 'Ceja',
  Conch: 'Conch',
  Industrial: 'Industrial',
  'Upper Lobe': 'Upper lobe',
  Tragus: 'Tragus',
  Lengua: 'Lengua',
  Cristina: 'Cristina',
  Daith: 'Daith',
  Rook: 'Rook',
  Antihelix: 'Antihelix',
  Contrahelix: 'Contrahelix',
  Flat: 'Flat',
};

const PIERCING_TYPE_ALIASES: Record<string, string> = {
  helix: 'Helix',
  hellix: 'Helix',
  lobulo: 'Lobulos',
  lobulos: 'Lobulos',
  'lobulo superior': 'Upper Lobe',
  'upper lobe': 'Upper Lobe',
  'expansion lobulos': 'Expansion Lobulos',
  'expansion lobulo': 'Expansion Lobulos',
  nostril: 'Nostril',
  nostry: 'Nostril',
  nariz: 'Nostril',
  surface: 'Surface',
  microdermal: 'Microdermal',
  septum: 'Septum',
  labio: 'Labio',
  ombligo: 'Ombligo',
  pezon: 'Pezon',
  ceja: 'Ceja',
  conch: 'Conch',
  industrial: 'Industrial',
  tragus: 'Tragus',
  lengua: 'Lengua',
  cristina: 'Cristina',
  daith: 'Daith',
  rook: 'Rook',
  antihelix: 'Antihelix',
  contrahelix: 'Contrahelix',
  flat: 'Flat',
};

export function asciiFoldPiercing(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildPiercingTypeIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const opt of PIERCING_TYPE_OPTIONS) {
    index.set(asciiFoldPiercing(opt), opt);
    const display = PIERCING_TYPE_DISPLAY_ES[opt];
    if (display) index.set(asciiFoldPiercing(display), opt);
  }
  for (const [alias, canonical] of Object.entries(PIERCING_TYPE_ALIASES)) {
    index.set(asciiFoldPiercing(alias), canonical);
  }
  return index;
}

const PIERCING_TYPE_INDEX = buildPiercingTypeIndex();

export function piercingTypeDisplayLabel(canonical: string): string {
  const c = (canonical || '').trim();
  if (!c) return '—';
  return PIERCING_TYPE_DISPLAY_ES[c] ?? c;
}

export function resolvePiercingTypeCanonical(raw: string | null | undefined): string | null {
  const piece = String(raw ?? '').trim();
  if (!piece) return null;
  const key = asciiFoldPiercing(piece);
  const exact = PIERCING_TYPE_INDEX.get(key);
  if (exact) return exact;
  for (const [normKey, canonical] of PIERCING_TYPE_INDEX) {
    if (normKey.length >= 4 && (key.includes(normKey) || normKey.includes(key))) {
      return canonical;
    }
  }
  return null;
}

export function isPiercingAnatomyFilter(value: string): boolean {
  const v = (value || '').trim();
  if (!v || v === 'Todos') return false;
  return PIERCING_TYPE_OPTIONS.includes(v as PiercingTypeCanonical);
}

/** Opciones UI: trabajo (colocación/limpieza/cambio) + tipos anatómicos. */
export function buildPiercingFilterOptions(
  workKindOptions: { value: string; label: string }[],
): { value: string; label: string }[] {
  const anatomy = PIERCING_TYPE_OPTIONS.map((canonical) => ({
    value: canonical,
    label: piercingTypeDisplayLabel(canonical),
  }));
  return [...workKindOptions, ...anatomy];
}

/** IDs de citas no tatuaje para consultar tipo anatómico en encuesta. */
export function piercingAppointmentIdsForLabels(items: Appointment[]): number[] {
  const ids = new Set<number>();
  for (const row of items) {
    if (inferWorkKindFromAppointment(row) === 'tatuaje') continue;
    if (row.id > 0) ids.add(row.id);
  }
  return [...ids].sort((a, b) => a - b);
}
