import {
  SurveyAnswerPayload,
  SurveySubmitPayload,
} from '../services/contract-signing-api.service';
import {
  PIERCING_TYPE_OPTIONS,
  piercingTypeDisplayLabel,
  resolvePiercingTypeCanonical,
} from '../../models/piercing-type-catalog';

/** Pregunta de encuesta cuya respuesta elige el PDF de cuidados de piercing (paridad backend). */
export const PROCEDURE_CONSENT_SURVEY_QUESTION_ID = 3;

export { PIERCING_TYPE_OPTIONS, piercingTypeDisplayLabel };

/** Inserta o reemplaza la respuesta de tipo de piercing (pregunta fija) en el payload de encuesta. */
export function withPiercingTypeSurveyAnswer(
  payload: SurveySubmitPayload | null,
  appointmentId: number,
  piercingTypeCanonical: string,
): SurveySubmitPayload {
  const label = piercingTypeDisplayLabel(piercingTypeCanonical).trim() || piercingTypeCanonical;
  const qid = PROCEDURE_CONSENT_SURVEY_QUESTION_ID;
  const baseAnswers = payload?.answers ? [...payload.answers] : [];
  const without = baseAnswers.filter((a) => Number(a.question_id) !== qid);
  const answer: SurveyAnswerPayload = { question_id: qid, text: label };
  return {
    appointment_id: appointmentId,
    would_recommend: payload?.would_recommend ?? true,
    answers: [...without, answer],
  };
}

export function inferPiercingTypeFromAppointmentDetail(
  detail: string | null | undefined,
): string | null {
  return resolvePiercingTypeCanonical(detail ?? '');
}
