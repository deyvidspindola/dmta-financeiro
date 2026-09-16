import { create } from 'zustand';

export type TransactionStatusFilter = 'all' | 'settled' | 'pending';

interface TransactionFilterState {
  status: TransactionStatusFilter;
  accountId: string | null;
  categoryId: string | null;
  useCustomPeriod: boolean;
  /** ISO `YYYY-MM-DD` — só relevantes quando `useCustomPeriod`. */
  periodFrom: string | null;
  periodTo: string | null;
  setStatus: (status: TransactionStatusFilter) => void;
  setAccountId: (accountId: string | null) => void;
  setCategoryId: (categoryId: string | null) => void;
  setPeriod: (useCustomPeriod: boolean, from: string | null, to: string | null) => void;
  reset: () => void;
}

const DEFAULTS = {
  status: 'all' as TransactionStatusFilter,
  accountId: null,
  categoryId: null,
  useCustomPeriod: false,
  periodFrom: null,
  periodTo: null,
};

/**
 * Filtro de Transações (tela `app/transaction-filters.tsx`) — em memória,
 * não persiste entre sessões de propósito (filtro é um estado de "estou
 * olhando isso agora", não uma preferência duradoura). A tela de lista
 * (`app/(tabs)/transactions.tsx`) lê daqui; a tela de filtro escreve só
 * ao confirmar.
 */
export const useTransactionFilterStore = create<TransactionFilterState>()((set) => ({
  ...DEFAULTS,
  setStatus: (status) => set({ status }),
  setAccountId: (accountId) => set({ accountId }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setPeriod: (useCustomPeriod, periodFrom, periodTo) =>
    set({ useCustomPeriod, periodFrom, periodTo }),
  reset: () => set({ ...DEFAULTS }),
}));

export function hasActiveTransactionFilters(state: TransactionFilterState): boolean {
  return (
    state.status !== 'all' ||
    state.accountId !== null ||
    state.categoryId !== null ||
    state.useCustomPeriod
  );
}
