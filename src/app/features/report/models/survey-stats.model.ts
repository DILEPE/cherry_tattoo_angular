export interface SurveyQuestionStatRow {
  question_id: number;
  label: string;
  question_type: string;
  sort_order: number;
  contract_kind: string;
  is_active: boolean;
  response_count: number;
  avg_rating?: number | null;
  yes_count?: number | null;
  no_count?: number | null;
  text_response_count?: number | null;
  avg_number?: number | null;
  rating_breakdown?: Record<string, number> | null;
  number_breakdown?: Record<string, number> | null;
  choice_breakdown?: Record<string, number> | null;
}

export const SURVEY_TYPE_LABEL_ES: Record<string, string> = {
  rating_1_5: 'Calificación 1–5',
  yes_no: 'Sí / No',
  number: 'Número',
  radio: 'Opción única',
  select: 'Lista desplegable',
  checkbox: 'Casillas',
  text: 'Texto',
  textarea: 'Texto largo',
  text_short: 'Texto corto',
};

export const CONTRACT_KIND_LABEL_ES: Record<string, string> = {
  tattoo: 'Tatuaje',
  piercing: 'Perforación',
  both: 'Ambos',
};

export interface SurveyQuestionTextResponseRow {
  customer_id: number | null;
  response_text: string;
}

export function isSurveyTextQuestion(questionType: string): boolean {
  return ['text', 'textarea', 'text_short'].includes(String(questionType ?? '').trim());
}
