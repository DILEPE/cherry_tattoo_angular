export interface SignedContract {
  id: number;
  appointmentId: number | null;
  templateId: number | null;
  contractText: string | null;
  isMinor: boolean;
  createdAt: string | null;
}

export interface CustomerSignedContractRow {
  id: number;
  appointmentId: number;
  serviceType: string;
  appointmentDate: string | null;
}
