import {
  CUSTOMER_BIRTH_PENDING_ISO,
  Customer,
  CustomerContractRow,
  CustomerListResult,
  CustomerSnapshot,
  CustomerWritePayload,
  DocumentType,
} from './customer.model';

function toDocType(v: unknown): DocumentType {
  const s = String(v ?? 'CC').trim().toUpperCase();
  if (s === 'TI' || s === 'CE' || s === 'PAS') return s;
  return 'CC';
}

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function dateIso(v: unknown): string | null {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export function mapCustomer(raw: Record<string, unknown>): Customer {
  const birth = dateIso(raw['birth_date']) ?? CUSTOMER_BIRTH_PENDING_ISO;
  return {
    id: Number(raw['id'] ?? 0),
    firstName: String(raw['first_name'] ?? ''),
    lastName: String(raw['last_name'] ?? ''),
    birthDate: birth,
    birthDatePending: birth === CUSTOMER_BIRTH_PENDING_ISO,
    documentType: toDocType(raw['document_type']),
    documentNumber: String(raw['document_number'] ?? ''),
    documentIssueDate: dateIso(raw['document_issue_date']),
    email: String(raw['email'] ?? ''),
    phoneNumber: String(raw['phone_number'] ?? ''),
    address: strOrNull(raw['address']),
    nationality: strOrNull(raw['nationality']),
    profession: strOrNull(raw['profession']),
    socialMedia: strOrNull(raw['social_media']),
    emergencyContactName: strOrNull(raw['emergency_contact_name']),
    emergencyContactPhone: strOrNull(raw['emergency_contact_phone']),
    isMinor: Boolean(raw['is_minor']),
    guardianName: strOrNull(raw['guardian_name']),
    guardianDocumentType: raw['guardian_document_type']
      ? toDocType(raw['guardian_document_type'])
      : null,
    guardianDocumentNumber: strOrNull(raw['guardian_document_number']),
    guardianDocumentIssueDate: dateIso(raw['guardian_document_issue_date']),
    createdAt: raw['created_at'] != null ? String(raw['created_at']) : null,
    updatedAt: raw['updated_at'] != null ? String(raw['updated_at']) : null,
  };
}

export function mapCustomerSnapshot(raw: Record<string, unknown>): CustomerSnapshot {
  return {
    id: Number(raw['id'] ?? 0),
    firstName: String(raw['first_name'] ?? ''),
    lastName: String(raw['last_name'] ?? ''),
    phoneNumber: String(raw['phone_number'] ?? ''),
    email: String(raw['email'] ?? ''),
    documentType: String(raw['document_type'] ?? 'CC'),
    documentNumber: String(raw['document_number'] ?? ''),
  };
}

export function mapCustomerList(
  raw: Record<string, unknown> | Record<string, unknown>[] | null | undefined,
): CustomerListResult {
  if (!raw) return { items: [], total: 0 };
  if (Array.isArray(raw)) {
    const items = raw.map((r) => mapCustomer(r));
    return { items, total: items.length };
  }
  const itemsRaw = raw['items'];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((r) => mapCustomer(r as Record<string, unknown>))
    : [];
  return { items, total: Number(raw['total'] ?? items.length) };
}

export function customerDisplayName(c: Pick<Customer, 'firstName' | 'lastName'>): string {
  return `${c.firstName} ${c.lastName}`.trim() || '—';
}

export function customerDocumentLabel(c: Pick<Customer, 'documentType' | 'documentNumber'>): string {
  return `${c.documentType} ${c.documentNumber}`.trim();
}

export function formatBirthDateDisplay(iso: string, pending: boolean): string {
  if (pending || iso === CUSTOMER_BIRTH_PENDING_ISO) return 'Pendiente';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function customerToWritePayload(c: Customer): CustomerWritePayload {
  return {
    first_name: c.firstName.trim(),
    last_name: c.lastName.trim(),
    birth_date: c.birthDate,
    document_type: c.documentType,
    document_number: c.documentNumber.trim(),
    document_issue_date: c.birthDatePending ? null : c.documentIssueDate,
    email: c.email.trim(),
    phone_number: c.phoneNumber.trim(),
    address: c.address,
    nationality: c.nationality,
    profession: c.profession,
    social_media: c.socialMedia,
    emergency_contact_name: c.emergencyContactName,
    emergency_contact_phone: c.emergencyContactPhone,
    is_minor: c.isMinor,
    guardian_name: c.isMinor ? c.guardianName : null,
    guardian_document_type: c.isMinor ? c.guardianDocumentType : null,
    guardian_document_number: c.isMinor ? c.guardianDocumentNumber : null,
    guardian_document_issue_date: c.isMinor ? c.guardianDocumentIssueDate : null,
  };
}

export function mapCustomerContract(raw: Record<string, unknown>): CustomerContractRow {
  return {
    id: Number(raw['id'] ?? 0),
    appointmentId: Number(raw['appointment_id'] ?? 0),
    serviceType: String(raw['service_type'] ?? ''),
    appointmentDate:
      raw['appointment_date'] != null ? String(raw['appointment_date']) : null,
  };
}
