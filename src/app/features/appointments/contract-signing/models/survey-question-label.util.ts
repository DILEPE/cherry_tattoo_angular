const SERVICE_TYPE_PLACEHOLDER = '{service_type}';

/** Sustituye `{service_type}` en etiquetas de encuesta (p. ej. «previas al tatuaje»). */
export function formatSurveyQuestionLabel(
  label: string,
  serviceType: string | null | undefined,
): string {
  const text = (label || '').trim() || 'Pregunta';
  if (!text.includes(SERVICE_TYPE_PLACEHOLDER)) {
    return text;
  }
  const svc = (serviceType || '').trim();
  const phrase = svc ? svc.toLowerCase() : 'procedimiento';
  return text.replaceAll(SERVICE_TYPE_PLACEHOLDER, phrase);
}

/** Preguntas largas ocupan el ancho completo del grid (como en Streamlit con etiquetas altas). */
export function surveyQuestionSpansFullWidth(label: string): boolean {
  return label.length > 110;
}

function foldLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Pregunta de encuesta que declara el precio del trabajo (tatuaje o piercing). */
export function isServiceCostQuestionLabel(label: string): boolean {
  const lbl = foldLabel(label);
  if (lbl.includes('valor') && lbl.includes('procedimiento')) return true;
  const mentionsCost = lbl.includes('costo');
  const mentionsWork =
    lbl.includes('servicio') || lbl.includes('procedimiento') || lbl.includes('trabajo');
  return mentionsCost && mentionsWork;
}

export function serviceCostFromSurvey(
  questions: readonly { id: number; label: string }[],
  answers: readonly { question_id: number; number?: number | null }[],
  serviceType?: string | null,
): number | null {
  const ids = new Set(
    questions
      .filter((q) => isServiceCostQuestionLabel(formatSurveyQuestionLabel(q.label, serviceType)))
      .map((q) => q.id),
  );
  let found: number | null = null;
  for (const answer of answers) {
    if (!ids.has(answer.question_id)) continue;
    const num = Number(answer.number);
    if (!Number.isFinite(num) || num <= 0) continue;
    found = Math.round(num);
  }
  return found;
}
