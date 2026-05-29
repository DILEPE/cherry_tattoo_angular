import { CustomerSignedContractRow, SignedContract } from './signed-contract.model';

export function mapCustomerSignedContract(raw: Record<string, unknown>): CustomerSignedContractRow {
  return {
    id: Number(raw['id'] ?? 0),
    appointmentId: Number(raw['appointment_id'] ?? 0),
    serviceType: String(raw['service_type'] ?? ''),
    appointmentDate:
      raw['appointment_date'] != null ? String(raw['appointment_date']) : null,
  };
}

export function mapSignedContract(raw: Record<string, unknown>): SignedContract {
  return {
    id: Number(raw['id'] ?? 0),
    appointmentId: raw['appointment_id'] != null ? Number(raw['appointment_id']) : null,
    templateId: raw['template_id'] != null ? Number(raw['template_id']) : null,
    contractText: raw['contract_text'] != null ? String(raw['contract_text']) : null,
    isMinor: Boolean(raw['is_minor']),
    createdAt: raw['created_at'] != null ? String(raw['created_at']) : null,
  };
}
