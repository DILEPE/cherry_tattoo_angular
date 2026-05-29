import {
  SurveyQuestion,
  SurveyQuestionFormValue,
  SurveyQuestionScope,
  SurveyQuestionType,
  SurveyQuestionWritePayload,
  SURVEY_TYPES_NEEDING_OPTIONS,
} from './survey-question.model';

function toType(v: unknown): SurveyQuestionType {
  const s = String(v ?? 'text_short').trim() as SurveyQuestionType;
  return s || 'text_short';
}

function toScope(v: unknown): SurveyQuestionScope {
  const s = String(v ?? 'both').trim();
  if (s === 'tattoo' || s === 'piercing' || s === 'both') return s;
  return 'both';
}

function parseOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

export function mapSurveyQuestion(raw: Record<string, unknown>): SurveyQuestion {
  return {
    id: Number(raw['id'] ?? 0),
    label: String(raw['label'] ?? ''),
    questionType: toType(raw['question_type']),
    options: parseOptions(raw['options']),
    sortOrder: Number(raw['sort_order'] ?? 0),
    contractKind: toScope(raw['contract_kind']),
    isActive: Boolean(raw['is_active'] ?? true),
  };
}

export function optionsFromLines(blob: string): string[] {
  return blob
    .split(/\r?\n/)
    .map((ln) => ln.trim())
    .filter(Boolean);
}

export function optionsToLines(options: string[]): string {
  return options.join('\n');
}

export function formToWritePayload(
  v: SurveyQuestionFormValue,
  extras: { sortOrder: number; isActive?: boolean },
): SurveyQuestionWritePayload {
  const body: SurveyQuestionWritePayload = {
    label: v.label.trim(),
    question_type: v.questionType,
    sort_order: extras.sortOrder,
    contract_kind: v.contractKind,
    is_active: extras.isActive ?? v.isActive,
  };
  if (SURVEY_TYPES_NEEDING_OPTIONS.has(v.questionType)) {
    body.options = optionsFromLines(v.optionsLines);
  }
  return body;
}

export function questionToFormValue(q: SurveyQuestion): SurveyQuestionFormValue {
  return {
    label: q.label,
    questionType: q.questionType,
    optionsLines: optionsToLines(q.options),
    contractKind: q.contractKind,
    isActive: q.isActive,
  };
}

export function mapDeletionImpact(raw: Record<string, unknown>): {
  questionId: number;
  label: string;
  registeredAnswers: number;
} {
  return {
    questionId: Number(raw['question_id'] ?? 0),
    label: String(raw['label'] ?? ''),
    registeredAnswers: Number(raw['registered_answers'] ?? 0),
  };
}
