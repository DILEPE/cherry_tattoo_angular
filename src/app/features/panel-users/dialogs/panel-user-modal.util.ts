import { PanelUserModalData } from '../models/panel-user-modal.model';

export function resolvePanelUserModalData(ui: {
  activeModal: () => { data: unknown } | null;
}): PanelUserModalData {
  const data = ui.activeModal()?.data;
  if (data && typeof data === 'object') {
    return data as PanelUserModalData;
  }
  return {};
}

export function resolvePanelUserModalId(ui: {
  activeModal: () => { data: unknown } | null;
}): number {
  return Number(resolvePanelUserModalData(ui).userId ?? 0);
}
