import { colorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Tema visual do app. NÃO é o `themeStore` do apps/web (aquele mexe em
 * `document.documentElement.classList` — DOM). Aqui o dark mode é do
 * NativeWind: `colorScheme.set('system' | 'light' | 'dark')` alterna a
 * classe `dark` internamente e as CSS vars de src/styles/global.css trocam.
 */
export type ThemePref = 'system' | 'light' | 'dark';

interface ThemeState {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
  toggle: () => void;
}

export function applyTheme(pref: ThemePref): void {
  colorScheme.set(pref);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      pref: 'system',
      setPref: (pref) => {
        applyTheme(pref);
        set({ pref });
      },
      toggle: () => {
        const current = get().pref;
        get().setPref(current === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: 'dmta-financeiro-theme',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => applyTheme(state?.pref ?? 'system'),
    },
  ),
);
