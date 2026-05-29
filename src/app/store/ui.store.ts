import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ModalState<T = unknown> {
  id: string;
  data: T;
}

interface UiState {
  activeModal: ModalState | null;
  toasts: Toast[];
  globalLoading: boolean;
  loadingMessage: string | null;
}

const initialState: UiState = {
  activeModal: null,
  toasts: [],
  globalLoading: false,
  loadingMessage: null,
};

export const UiStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const dismiss = (id: string) => {
      patchState(store, { toasts: store.toasts().filter((t) => t.id !== id) });
    };
    return {
      openModal<T>(id: string, data: T): void {
        patchState(store, { activeModal: { id, data: data as unknown } });
      },
      closeModal(): void {
        patchState(store, { activeModal: null });
      },
      setGlobalLoading(loading: boolean, message: string | null = null): void {
        patchState(store, {
          globalLoading: loading,
          loadingMessage: loading ? message : null,
        });
      },
      showToast(toast: Omit<Toast, 'id'>): void {
        const id = crypto.randomUUID();
        const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
        patchState(store, { toasts: [...store.toasts(), { ...toast, id, duration }] });
        setTimeout(() => dismiss(id), duration);
      },
      dismissToast: dismiss,
    };
  }),
);
