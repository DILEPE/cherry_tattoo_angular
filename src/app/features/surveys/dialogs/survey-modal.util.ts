import { SurveyModalData } from '../models/survey-modal.model';
import { SurveyQuestion } from '../models/survey-question.model';

export function resolveSurveyModalData(ui: {
  activeModal: () => { data: unknown } | null;
}): SurveyModalData {
  const data = ui.activeModal()?.data;
  if (data && typeof data === 'object') {
    return data as SurveyModalData;
  }
  return {};
}

export function resolveSurveyQuestionModalId(ui: {
  activeModal: () => { data: unknown } | null;
}): number {
  return Number(resolveSurveyModalData(ui).questionId ?? 0);
}

export function findSurveyQuestion(
  items: SurveyQuestion[],
  questionId: number,
): SurveyQuestion | null {
  return items.find((q) => q.id === questionId) ?? null;
}
