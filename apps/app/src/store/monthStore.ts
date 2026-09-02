import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { currentMonthKey } from '@/lib/dates';

/**
 * Mês selecionado globalmente (YYYY-MM) — o "navegador de mês" no topo.
 * Porte do apps/web; só troca localStorage por AsyncStorage. O consumo
 * pelas telas (dashboard, lançamentos) chega no PR B1/B2.
 */
interface MonthState {
  month: string;
  setMonth: (month: string) => void;
  shift: (delta: number) => void;
  reset: () => void;
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const base = new Date(year ?? 2000, (month ?? 1) - 1 + delta, 1);
  return currentMonthKey(base);
}

export const useMonthStore = create<MonthState>()(
  persist(
    (set) => ({
      month: currentMonthKey(),
      setMonth: (month) => set({ month }),
      shift: (delta) => set((state) => ({ month: shiftMonthKey(state.month, delta) })),
      reset: () => set({ month: currentMonthKey() }),
    }),
    {
      name: 'dmta-financeiro-month',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
