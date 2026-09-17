import { create } from 'zustand';

/**
 * Porte do apps/web/src/store/toastStore.ts, sem DOM:
 *  - `window.setTimeout` -> `setTimeout` (global do RN)
 *  - `crypto.randomUUID()` -> contador local (RN Hermes não expõe
 *    `crypto.randomUUID` de forma confiável).
 */
export type ToastTone = 'success' | 'error';

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

interface ToastState {
  toasts: Toast[];
  /** `durationMs` sobrescreve o tempo padrão — útil pra mensagem de erro mais longa que precisa de mais tempo de leitura. */
  push: (message: string, tone?: ToastTone, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 3500;

let seq = 0;
function nextId(): string {
  seq += 1;
  return `t${Date.now()}_${seq}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = 'success', durationMs = AUTO_DISMISS_MS) => {
    const id = nextId();
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export function toastSuccess(message: string): void {
  useToastStore.getState().push(message, 'success');
}

export function toastError(message: string): void {
  useToastStore.getState().push(message, 'error');
}
