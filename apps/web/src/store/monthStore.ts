import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { currentMonthKey } from '@/lib/dates'

/** Mês selecionado globalmente (YYYY-MM) — o "navegador de mês" no topo. */
interface MonthState {
  month: string
  setMonth: (month: string) => void
  shift: (delta: number) => void
  reset: () => void
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const base = new Date(year ?? 2000, (month ?? 1) - 1 + delta, 1)
  return currentMonthKey(base)
}

export const useMonthStore = create<MonthState>()(
  persist(
    (set) => ({
      month: currentMonthKey(),
      setMonth: (month) => set({ month }),
      shift: (delta) => set((state) => ({ month: shiftMonthKey(state.month, delta) })),
      reset: () => set({ month: currentMonthKey() }),
    }),
    { name: 'dmta-financeiro-month' },
  ),
)
