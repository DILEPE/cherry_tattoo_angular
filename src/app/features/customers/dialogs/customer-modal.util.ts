import { ModalState } from '../../../store/ui.store';
import { CustomerModalData } from '../models/customer-modal.model';

export function resolveCustomerModalId(ui: {
  activeModal: () => ModalState | null;
}): number {
  const data = ui.activeModal()?.data as CustomerModalData | undefined;
  return Number(data?.customerId ?? 0);
}

export function resolveCustomerModalName(ui: {
  activeModal: () => ModalState | null;
}): string {
  const data = ui.activeModal()?.data as CustomerModalData | undefined;
  return String(data?.customerName ?? '').trim();
}
