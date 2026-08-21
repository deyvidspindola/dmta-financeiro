import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Context, User } from '@/types/models'

const CONSOLIDATED = 'consolidated' as const

export type ActiveScope = string | typeof CONSOLIDATED

interface AuthState {
  token: string | null
  user: User | null
  contexts: Context[]
  activeScope: ActiveScope
  setSession: (payload: {
    token: string
    user: User
    contexts: Context[]
  }) => void
  setUser: (user: User) => void
  setActiveScope: (scope: ActiveScope) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      contexts: [],
      activeScope: CONSOLIDATED,
      setSession: ({ token, user, contexts }) =>
        set({
          token,
          user,
          contexts,
          activeScope: contexts[0]?.id ?? CONSOLIDATED,
        }),
      setUser: (user) => set({ user }),
      setActiveScope: (activeScope) => set({ activeScope }),
      clearSession: () =>
        set({
          token: null,
          user: null,
          contexts: [],
          activeScope: CONSOLIDATED,
        }),
    }),
    { name: 'dmta-financeiro-auth' },
  ),
)

export { CONSOLIDATED }
