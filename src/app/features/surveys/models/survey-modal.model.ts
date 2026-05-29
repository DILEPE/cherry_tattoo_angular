export type SurveyModalId = 'question-create' | 'question-edit' | 'question-delete';

export interface SurveyModalData {
  questionId?: number;
  questionLabel?: string;
}
