import { SurveyQuestionStatRow } from './survey-stats.model';

export interface SurveyChartEntry {
  key: string;
  count: number;
}

export type SurveyChartVariant = 'pie' | 'bar';

const CHART_COLORS = [
  '#d90064',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#64748b',
  '#ec4899',
  '#14b8a6',
] as const;

export function surveyChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function truncateSurveyChartLabel(s: string, maxLen = 50): string {
  const t = String(s ?? '')
    .replace(/\n/g, ' ')
    .trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export function isProcedureValueQuestion(label: string): boolean {
  const n = String(label ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  return n.includes('procedimiento') && n.includes('valor');
}

export function questionTypeSupportsChart(questionType: string): boolean {
  const qt = String(questionType ?? '').trim();
  return ['rating_1_5', 'yes_no', 'number', 'radio', 'select', 'checkbox'].includes(qt);
}

function applyOthersLimit(
  items: SurveyChartEntry[],
  limit: number | null,
): SurveyChartEntry[] {
  if (limit == null || limit <= 0 || items.length <= limit) return items;
  const head = items.slice(0, Math.max(0, limit - 1));
  const tail = items.slice(limit - 1);
  const otros = tail.reduce((s, x) => s + x.count, 0);
  if (otros > 0) head.push({ key: 'Otros', count: otros });
  return head;
}

function entriesFromRecord(
  raw: Record<string, number> | null | undefined,
  sortKey?: (a: SurveyChartEntry, b: SurveyChartEntry) => number,
): SurveyChartEntry[] {
  if (!raw) return [];
  const items = Object.entries(raw)
    .filter(([, v]) => Number(v) > 0)
    .map(([key, count]) => ({ key, count: Number(count) }));
  if (sortKey) items.sort(sortKey);
  else items.sort((a, b) => b.count - a.count);
  return items;
}

export function surveyChartVariant(row: SurveyQuestionStatRow): SurveyChartVariant {
  if (
    row.question_type === 'number' &&
    isProcedureValueQuestion(row.label) &&
    row.number_breakdown &&
    Object.keys(row.number_breakdown).length > 0
  ) {
    return 'bar';
  }
  return 'pie';
}

export function surveyChartEntries(row: SurveyQuestionStatRow): SurveyChartEntry[] {
  const qt = row.question_type;

  if (qt === 'rating_1_5') {
    return applyOthersLimit(
      entriesFromRecord(row.rating_breakdown ?? undefined, (a, b) => {
        const na = Number(a.key);
        const nb = Number(b.key);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.key.localeCompare(b.key);
      }),
      null,
    );
  }

  if (qt === 'yes_no') {
    return [
      { key: 'Sí', count: row.yes_count ?? 0 },
      { key: 'No', count: row.no_count ?? 0 },
    ].filter((x) => x.count > 0);
  }

  if (qt === 'number') {
    return applyOthersLimit(
      entriesFromRecord(row.number_breakdown ?? undefined, (a, b) => {
        const na = Number(a.key);
        const nb = Number(b.key);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.key.localeCompare(b.key);
      }),
      null,
    );
  }

  if (['radio', 'select', 'checkbox'].includes(qt)) {
    const limit = qt === 'checkbox' ? 24 : 32;
    return applyOthersLimit(
      entriesFromRecord(row.choice_breakdown ?? undefined),
      limit,
    );
  }

  return [];
}

export function surveyChartTotal(entries: SurveyChartEntry[]): number {
  return entries.reduce((s, e) => s + e.count, 0);
}

export function surveyPieConicGradient(entries: SurveyChartEntry[]): string | null {
  const total = surveyChartTotal(entries);
  if (total <= 0) return null;
  let acc = 0;
  const stops: string[] = [];
  entries.forEach((e, i) => {
    const pct = (e.count / total) * 100;
    const color = surveyChartColor(i);
    stops.push(`${color} ${acc}% ${acc + pct}%`);
    acc += pct;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

export interface SurveyPieSliceLabel {
  pct: string;
  left: string;
  top: string;
}

/** Posiciones de etiquetas % sobre la torta (ángulo medio de cada sector). */
export function surveyPieSliceLabels(
  entries: SurveyChartEntry[],
  minFraction = 0.05,
): SurveyPieSliceLabel[] {
  const total = surveyChartTotal(entries);
  if (total <= 0) return [];

  let angleDeg = -90;
  const radiusPct = 42;
  const labels: SurveyPieSliceLabel[] = [];

  for (const e of entries) {
    const fraction = e.count / total;
    const sweep = fraction * 360;
    const midDeg = angleDeg + sweep / 2;
    angleDeg += sweep;

    const show =
      fraction >= minFraction || (entries.length <= 6 && fraction > 0);
    if (!show) continue;

    const rad = (midDeg * Math.PI) / 180;
    const x = 50 + radiusPct * Math.cos(rad);
    const y = 50 + radiusPct * Math.sin(rad);
    labels.push({
      pct: (fraction * 100).toFixed(1),
      left: `${x}%`,
      top: `${y}%`,
    });
  }

  return labels;
}
