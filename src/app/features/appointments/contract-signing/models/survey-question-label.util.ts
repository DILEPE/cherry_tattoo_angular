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
