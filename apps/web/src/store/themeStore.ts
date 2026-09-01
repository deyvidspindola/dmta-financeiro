import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Tema visual: segue o sistema, ou fixo em claro/escuro. */
export type ThemePref = 'system' | 'light' | 'dark'

interface ThemeState {
  pref: ThemePref
  setPref: (pref: ThemePref) => void
  toggle: () => void
}

/** Classe `dark` no <html> conforme a preferência (e o sistema, quando 'system'). */
export function applyTheme(pref: ThemePref): void {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = pref === 'dark' || (pref === 'system' && systemDark)
  document.documentElement.classList.toggle('dark', dark)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      pref: 'system',
      setPref: (pref) => {
        applyTheme(pref)
        set({ pref })
      },
      toggle: () => {
        const isDark = document.documentElement.classList.contains('dark')
        get().setPref(isDark ? 'light' : 'dark')
      },
    }),
    {
      name: 'dmta-financeiro-theme',
      onRehydrateStorage: () => (state) => applyTheme(state?.pref ?? 'system'),
    },
  ),
)
