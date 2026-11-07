import { combineAppointmentDatetime } from '../../models/appointment-slots';

const DRAFT_KEY = 'cherry_kiosk_draft_appointment';

export function readKioskDraftId(): number {
  const n = Number(sessionStorage.getItem(DRAFT_KEY) ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function writeKioskDraftId(id: number): void {
  if (id > 0) sessionStorage.setItem(DRAFT_KEY, String(id));
}

export function isClientCreatedAppointment(appointmentId: number): boolean {
  return appointmentId > 0 && readKioskDraftId() === appointmentId;
}

/** Deja en el detalle el texto que el recibo muestra en DISEÑO, sin perder el bloque de agenda. */
export function detailWithReceiptDesign(currentDetail: string, design: string): string {
  const text = design.trim();
  if (!text) return currentDetail;
  const marker = currentDetail.match(/\[agenda_slots:\d+\]/i)?.[0] ?? '[agenda_slots:1]';
  return `Descripción del diseño: ${text} ${marker}`;
}

/** Hora local exacta de la firma o del alta (21:36 se guarda como 21:36). */
export function signingAgendaDateTime(now = new Date()): string {
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return combineAppointmentDatetime(now, hm);
}
