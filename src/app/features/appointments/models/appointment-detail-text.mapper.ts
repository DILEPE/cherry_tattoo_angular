const AGENDA_SLOTS_PATTERN = /\s*\[agenda_slots:(\d+)\]\s*$/i;
const LEADING_TAG = /^\s*\[([^\]\n]{1,64})\]\s*/i;
const DESIGN_OBS_SEP = '\n---\n';

export function appointmentDetailPlainBody(detailFull: string): string {
  let core = (detailFull || '').trim();
  const m = AGENDA_SLOTS_PATTERN.exec(core);
  if (m) core = core.slice(0, m.index).trim();
  const tm = LEADING_TAG.exec(core);
  if (tm) core = core.slice(tm[0].length).trim();
  return core;
}

export function splitDesignObsPlain(core: string): { design: string; observations: string } {
  const c = (core || '').trim();
  if (c.includes(DESIGN_OBS_SEP)) {
    const [a, , b] = c.split(DESIGN_OBS_SEP);
    return { design: a.trim(), observations: b.trim() };
  }
  return { design: c, observations: '' };
}

import { Appointment } from './appointment.model';
import {
  appendAgendaSlotsMarker,
  inferWorkKindFromAppointment,
  serviceAndDetailForWorkKind,
} from './booking.mapper';
import { durationSlotsForRow } from './agenda-slots.mapper';
import {
  MAX_BOOKING_DURATION_SLOTS,
  MIN_BOOKING_DURATION_SLOTS,
} from './booking.mapper';

export function mergeDesignObsPlain(design: string, observations: string): string {
  const dz = design.trim();
  const nt = observations.trim();
  if (dz && nt) return `${dz}${DESIGN_OBS_SEP}${nt}`;
  return dz || nt;
}

export function rebuildDetailForPatch(
  appt: Appointment,
  design: string,
  observations: string,
  agendaSlotsOverride?: number,
): string {
  const slotsRaw =
    agendaSlotsOverride != null
      ? agendaSlotsOverride
      : durationSlotsForRow(appt);
  const slots = Math.max(
    MIN_BOOKING_DURATION_SLOTS,
    Math.min(MAX_BOOKING_DURATION_SLOTS, Math.round(slotsRaw)),
  );
  const wk = inferWorkKindFromAppointment(appt);
  const merged = mergeDesignObsPlain(design, observations);
  const { detail } = serviceAndDetailForWorkKind(wk, merged);
  return appendAgendaSlotsMarker(detail, slots);
}

export function formatAppointmentCreatedAtDisplay(raw: string | null | undefined): string {
  if (!raw) return '—';
  const s = String(raw).trim().replace('T', ' ');
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s.slice(0, 16);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
