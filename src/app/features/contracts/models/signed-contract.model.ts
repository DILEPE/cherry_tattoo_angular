export interface SignedContract {
  id: number;
  appointmentId: number | null;
  templateId: number | null;
  contractText: string | null;
  isMinor: boolean;
  createdAt: string | null;
  clientSignature: string | null;
  tutorSignature: string | null;
  artistSignature: string | null;
  tutorDocumentFront: string | null;
  tutorDocumentBack: string | null;
  minorDocumentFront: string | null;
  minorDocumentBack: string | null;
}

export interface CustomerSignedContractRow {
  id: number;
  appointmentId: number;
  serviceType: string;
  appointmentDate: string | null;
}
