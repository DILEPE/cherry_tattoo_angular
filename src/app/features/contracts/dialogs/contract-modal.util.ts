import { ContractModalData } from '../models/contract-modal.model';

export function resolveContractModalData(ui: {
  activeModal: () => { data: unknown } | null;
}): ContractModalData {
  const data = ui.activeModal()?.data;
  if (data && typeof data === 'object') {
    return data as ContractModalData;
  }
  return {};
}

export function resolveTemplateModalId(ui: {
  activeModal: () => { data: unknown } | null;
}): number {
  return Number(resolveContractModalData(ui).templateId ?? 0);
}

export function resolveContractReadId(ui: {
  activeModal: () => { data: unknown } | null;
}): number {
  return Number(resolveContractModalData(ui).contractId ?? 0);
}
