export interface ContractDetail {
  id: number;
  appointmentId: number;
  customerName: string;
  serviceType: string;
  appointmentDate: string | null;
  contractText: string;
  isMinor: boolean;
  clientSignature: string | null;
  tutorSignature: string | null;
  artistSignature: string | null;
  tutorDocumentFront: string | null;
  tutorDocumentBack: string | null;
}

export function mapContractDetail(raw: Record<string, unknown>): ContractDetail {
  return {
    id: Number(raw['id'] ?? 0),
    appointmentId: Number(raw['appointment_id'] ?? 0),
    customerName: String(raw['customer_name'] ?? '').trim(),
    serviceType: String(raw['service_type'] ?? '').trim(),
    appointmentDate:
      raw['appointment_date'] != null ? String(raw['appointment_date']) : null,
    contractText: String(raw['contract_text'] ?? ''),
    isMinor: Boolean(raw['is_minor']),
    clientSignature:
      typeof raw['client_signature'] === 'string' ? raw['client_signature'] : null,
    tutorSignature:
      typeof raw['tutor_signature'] === 'string' ? raw['tutor_signature'] : null,
    artistSignature:
      typeof raw['artist_signature'] === 'string' ? raw['artist_signature'] : null,
    tutorDocumentFront:
      typeof raw['tutor_document_front'] === 'string' ? raw['tutor_document_front'] : null,
    tutorDocumentBack:
      typeof raw['tutor_document_back'] === 'string' ? raw['tutor_document_back'] : null,
  };
}
