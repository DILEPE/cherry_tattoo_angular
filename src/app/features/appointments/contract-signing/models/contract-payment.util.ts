import { Appointment } from '../../models/appointment.model';

export function appointmentPaymentReadyForSignature(appt: Appointment): {
  ok: boolean;
  message: string | null;
} {
  const total = appt.financials.total;
  const pending = appt.financials.pending;
  if (total <= 0) {
    return {
      ok: false,
      message: 'Define el valor total del trabajo en Montos antes de firmar.',
    };
  }
  if (pending > 0.009) {
    return {
      ok: false,
      message:
        'El abono debe cubrir el valor total (saldo pendiente en cero) antes de firmar el contrato.',
    };
  }
  return { ok: true, message: null };
}
