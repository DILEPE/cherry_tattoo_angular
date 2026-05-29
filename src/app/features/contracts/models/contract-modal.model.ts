export type ContractModalId =
  | 'template-create'
  | 'template-edit'
  | 'template-delete'
  | 'contract-read';

export interface ContractModalData {
  templateId?: number;
  templateName?: string;
  contractId?: number;
  contractLabel?: string;
}
