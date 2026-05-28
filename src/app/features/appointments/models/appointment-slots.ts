import { appointmentRowDate, appointmentTimeHm } from './calendar.mapper';

/** Franjas cada 30 min (08:00–20:00), igual que Streamlit. */
export function timeSlotOptions(): string[] {
  const slots: string[] = [];
  for (let minutes = 8 * 60; minutes <= 20 * 60; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

export function parseExistingAppointmentSlot(
  raw: string | Date | null | undefined,
): { date: Date; slot: string } {
  const d = appointmentRowDate(raw ?? null);
  const hm = appointmentTimeHm(raw ?? null);
  const slotOpts = timeSlotOptions();
  const slot = hm !== '—' && slotOpts.includes(hm) ? hm : '09:00';
  return { date: d, slot };
}

export function combineAppointmentDatetime(date: Date, slotHm: string): string {
  const parts = (slotHm || '09:00').trim().split(':');
  const h = Number(parts[0]) || 9;
  const m = Number(parts[1]) || 0;
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export function formatDatetimeCompactEs(iso: string): string {
  const s = iso.replace('T', ' ').trim();
  if (s.length >= 16) return s.slice(0, 16);
  return s;
}
