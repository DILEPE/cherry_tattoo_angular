import { SurveyQuestion } from './survey-question.model';

export function surveyQuestionPreview(q: Pick<SurveyQuestion, 'questionType' | 'options'>): string {
  const opts = q.options ?? [];
  switch (q.questionType) {
    case 'rating_1_5':
      return '☆  ☆  ☆  ☆  ☆  — el cliente elige del 1 al 5';
    case 'yes_no':
      return '○  Sí      ○  No';
    case 'text':
    case 'textarea':
      return 'El cliente escribe un comentario…';
    case 'text_short':
      return 'El cliente escribe una respuesta corta…';
    case 'number':
      return 'El cliente escribe un número';
    case 'radio':
      if (!opts.length) return 'Sin opciones — edita la pregunta para añadir';
      return opts
        .slice(0, 5)
        .map((o) => `○ ${o}`)
        .join('  ·  ')
        .concat(opts.length > 5 ? '…' : '');
    case 'checkbox':
      if (!opts.length) return 'Sin opciones — edita la pregunta para añadir';
      return opts
        .slice(0, 5)
        .map((o) => `□ ${o}`)
        .join('  ·  ')
        .concat(opts.length > 5 ? '…' : '');
    case 'select':
      return opts.length ? `▼  ${opts[0]}  (lista desplegable)` : '▼  (lista desplegable)';
    default:
      return '';
  }
}
