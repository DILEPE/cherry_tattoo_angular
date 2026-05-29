export type DocumentType = 'CC' | 'TI' | 'CE' | 'PAS';

export const CUSTOMER_BIRTH_PENDING_ISO = '2001-07-13';
export const SOCIAL_MEDIA_MAX_LEN = 50;

/** Resumen para citas / búsqueda por documento. */
export interface CustomerSnapshot {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  documentType: string;
  documentNumber: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthDatePending: boolean;
  documentType: DocumentType;
  documentNumber: string;
  documentIssueDate: string | null;
  email: string;
  phoneNumber: string;
  address: string | null;
  nationality: string | null;
  profession: string | null;
  socialMedia: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isMinor: boolean;
  guardianName: string | null;
  guardianDocumentType: DocumentType | null;
  guardianDocumentNumber: string | null;
  guardianDocumentIssueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerListResult {
  items: Customer[];
  total: number;
}

export interface CustomerWritePayload {
  first_name: string;
  last_name: string;
  birth_date: string;
  document_type: DocumentType;
  document_number: string;
  document_issue_date?: string | null;
  email: string;
  phone_number: string;
  address?: string | null;
  nationality?: string | null;
  profession?: string | null;
  social_media?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  is_minor: boolean;
  guardian_name?: string | null;
  guardian_document_type?: DocumentType | null;
  guardian_document_number?: string | null;
  guardian_document_issue_date?: string | null;
}

export interface CustomerContractRow {
  id: number;
  appointmentId: number;
  serviceType: string;
  appointmentDate: string | null;
}
