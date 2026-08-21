import { create } from 'zustand'

export type ToastTone = 'success' | 'error'

export type Toast = {
  id: string
  message: string
  tone: ToastTone
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: ToastTone) => void
  dismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 3500

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { id, message, tone }],
    }))
    window.setTimeout(() => {
      get().dismiss(id)
    }, AUTO_DISMISS_MS)
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}))

export function toastSuccess(message: string): void {
  useToastStore.getState().push(message, 'success')
}

export function toastError(message: string): void {
  useToastStore.getState().push(message, 'error')
}
