export type SurveyQuestionType =
  | 'rating_1_5'
  | 'yes_no'
  | 'text'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'textarea'
  | 'text_short'
  | 'number';

export type SurveyQuestionScope = 'tattoo' | 'piercing' | 'both';

export const SURVEY_QUESTION_TYPES_CREATE: ReadonlyArray<{
  value: SurveyQuestionType;
  label: string;
}> = [
  { value: 'rating_1_5', label: 'Estrellas 1–5' },
  { value: 'yes_no', label: 'Sí o No' },
  { value: 'textarea', label: 'Comentario' },
  { value: 'text_short', label: 'Texto corto' },
  { value: 'radio', label: 'Una opción' },
  { value: 'checkbox', label: 'Varias opciones' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'number', label: 'Número' },
];

export const SURVEY_QUESTION_TYPES_ALL: ReadonlyArray<{
  value: SurveyQuestionType;
  label: string;
}> = [
  ...SURVEY_QUESTION_TYPES_CREATE,
  { value: 'text', label: 'Texto (histórico)' },
];

export const SURVEY_SCOPE_LABEL_ES: Record<SurveyQuestionScope, string> = {
  tattoo: 'Tatuaje',
  piercing: 'Piercing',
  both: 'Ambos',
};

export const SURVEY_TYPE_LABEL_ES: Record<string, string> = {
  rating_1_5: 'Estrellas 1–5',
  yes_no: 'Sí o No',
  text: 'Texto (histórico)',
  textarea: 'Comentario',
  text_short: 'Texto corto',
  number: 'Número',
  radio: 'Una opción',
  checkbox: 'Varias opciones',
  select: 'Lista desplegable',
};

export const SURVEY_TYPES_NEEDING_OPTIONS = new Set<SurveyQuestionType>([
  'radio',
  'checkbox',
  'select',
]);

export interface SurveyQuestion {
  id: number;
  label: string;
  questionType: SurveyQuestionType;
  options: string[];
  sortOrder: number;
  contractKind: SurveyQuestionScope;
  isActive: boolean;
}

export interface SurveyQuestionWritePayload {
  label: string;
  question_type: SurveyQuestionType;
  options?: string[];
  sort_order: number;
  contract_kind: SurveyQuestionScope;
  is_active: boolean;
}

export interface SurveyQuestionDeletionImpact {
  questionId: number;
  label: string;
  registeredAnswers: number;
}

export interface SurveyQuestionFormValue {
  label: string;
  questionType: SurveyQuestionType;
  optionsLines: string;
  contractKind: SurveyQuestionScope;
  isActive: boolean;
}
