export type CustomerModalId =
  | 'customer-create'
  | 'customer-edit'
  | 'customer-delete'
  | 'customer-contracts';

export interface CustomerModalData {
  customerId?: number;
  customerName?: string;
}
