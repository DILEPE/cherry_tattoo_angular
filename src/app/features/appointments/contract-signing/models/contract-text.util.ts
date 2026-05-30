import { Customer } from '../../../customers/models/customer.model';
import { Appointment } from '../../models/appointment.model';
import { appointmentToContractKind } from './contract-kind.util';

export function renderContractHtml(templateContent: string, customer: Customer): string {
  const isMinor = customer.isMinor;
  const replacements: Record<string, string> = {
    '{{nombres}}': `${customer.firstName} ${customer.lastName}`.trim(),
    '{{identificacion}}': customer.documentType,
    '{{numero_documento}}': customer.documentNumber,
    '{{fecha_expedicion}}': customer.documentIssueDate ?? '',
    '{{nombre_tutor}}': isMinor ? (customer.guardianName ?? '') : '',
    '{{identificacion_tutor}}': isMinor ? (customer.guardianDocumentType ?? '') : '',
    '{{numero_documento_tutor}}': isMinor ? (customer.guardianDocumentNumber ?? '') : '',
    '{{fecha_expedicion_tutor}}': isMinor ? (customer.guardianDocumentIssueDate ?? '') : '',
  };
  let out = templateContent;
  for (const [key, value] of Object.entries(replacements)) {
    out = out.split(key).join(value);
  }
  return out;
}

export function minorGuardianDeclarationHtml(
  customer: Customer,
  appt: Appointment,
  tutorName: string,
): string {
  const proc = appointmentToContractKind(appt) === 'tattoo' ? 'tatuaje' : 'piercing';
  const clientName = `${customer.firstName} ${customer.lastName}`.trim();
  const tutor = tutorName.trim() || '________________';
  return (
    `<div class="ctsig-declaration-alert">` +
    `<p><strong>Cliente:</strong> ${escapeHtml(clientName)} · ${escapeHtml(customer.documentType)} ${escapeHtml(customer.documentNumber)}</p>` +
    `<p>Autorizo en calidad de padre o madre, <strong>${escapeHtml(tutor)}</strong>, a mi hijo/a ` +
    `<strong>${escapeHtml(clientName)}</strong> a realizarse el <strong>${proc}</strong> en el lugar del cuerpo indicado en este documento bajo mi única responsabilidad.</p>` +
    `</div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const CONTRACT_NO_REFUND_NOTICE =
  'Por favor, tenga en cuenta que no hay devolución de dinero por citas apartadas, tampoco por abonos. En caso de modificaciones de último momento en los diseños, su valor puede aumentar.';
