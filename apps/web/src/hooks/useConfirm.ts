import { create } from 'zustand'

export type ConfirmTone = 'default' | 'danger'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void
}

type ConfirmState = {
  request: ConfirmRequest | null
  ask: (options: ConfirmOptions) => Promise<boolean>
  settle: (confirmed: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      const current = get().request
      current?.resolve(false)
      set({ request: { ...options, resolve } })
    }),
  settle: (confirmed) => {
    const current = get().request
    if (!current) return
    current.resolve(confirmed)
    set({ request: null })
  },
}))

/**
 * Substitui `window.confirm`. Retorna `true` se o usuário confirmar.
 *
 * ```ts
 * const confirm = useConfirm()
 * if (await confirm({ title, message, tone: 'danger' })) { ... }
 * ```
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return useConfirmStore((s) => s.ask)
}
