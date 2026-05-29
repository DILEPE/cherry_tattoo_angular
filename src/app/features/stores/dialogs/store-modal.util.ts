import { ModalState } from '../../../store/ui.store';
import { StoreModalData } from '../models/store-modal.model';

export function resolveStoreModalId(ui: { activeModal: () => ModalState | null }): number {
  const data = ui.activeModal()?.data as StoreModalData | undefined;
  return Number(data?.storeId ?? 0);
}

export function resolveStoreModalName(ui: { activeModal: () => ModalState | null }): string {
  const data = ui.activeModal()?.data as StoreModalData | undefined;
  return String(data?.storeName ?? '').trim();
}
