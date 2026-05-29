import { AppointmentPayment, AppointmentReceipt } from './appointment.model';

/** Mapa abono → recibo PDF (vínculo BD o heurística, como Streamlit). */
export function mapPaymentsToReceipts(
  payments: AppointmentPayment[],
  receipts: AppointmentReceipt[],
): Map<number, number> {
  const out = new Map<number, number>();
  const usedRids = new Set<number>();
  const unlinked: AppointmentReceipt[] = [];

  for (const rec of receipts) {
    if (rec.id <= 0) continue;
    const pid = rec.appointmentPaymentId;
    if (pid != null && pid > 0) {
      out.set(pid, rec.id);
      usedRids.add(rec.id);
    } else {
      unlinked.push(rec);
    }
  }

  for (const pr of payments) {
    const pid = pr.id;
    if (pid <= 0 || out.has(pid)) continue;
    const amt = pr.amount;
    const noteL = (pr.note ?? '').trim().toLowerCase();

    for (const rec of unlinked) {
      if (usedRids.has(rec.id)) continue;
      if (Math.abs(rec.amount - amt) >= 0.01) continue;
      const kind = rec.kind.toLowerCase();
      if (noteL.includes('inicial') && kind === 'inicial') {
        out.set(pid, rec.id);
        usedRids.add(rec.id);
        break;
      }
      if (kind === 'abono' && !noteL.includes('inicial')) {
        out.set(pid, rec.id);
        usedRids.add(rec.id);
        break;
      }
    }

    if (!out.has(pid)) {
      for (const rec of unlinked) {
        if (!usedRids.has(rec.id)) {
          out.set(pid, rec.id);
          usedRids.add(rec.id);
          break;
        }
      }
    }
  }

  return out;
}
