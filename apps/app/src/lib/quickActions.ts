import type { Feather } from '@expo/vector-icons';
import type { useRouter } from 'expo-router';
import { t } from '@/i18n';

export type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
};

/**
 * As 4 ações de lançamento rápido — usadas tanto no leque do FAB
 * (`app/(tabs)/_layout.tsx`) quanto na fileira de atalhos da Home
 * (`QuickActions.tsx`). Um único array evita as duas listas divergirem.
 */
export function getQuickActions(router: ReturnType<typeof useRouter>): QuickAction[] {
  return [
    {
      key: 'transfer',
      label: t.nav.fabTransfer,
      icon: 'repeat',
      color: '#a78bfa',
      onPress: () => router.push({ pathname: '/new', params: { type: 'transfer' } }),
    },
    {
      key: 'income',
      label: t.newTransaction.typeIncome,
      icon: 'trending-up',
      color: '#34d399',
      onPress: () => router.push({ pathname: '/new', params: { type: 'income' } }),
    },
    {
      key: 'card',
      label: t.nav.fabCardExpense,
      icon: 'credit-card',
      color: '#22d3ee',
      onPress: () => router.push('/(tabs)/cards'),
    },
    {
      key: 'expense',
      label: t.newTransaction.typeExpense,
      icon: 'trending-down',
      color: '#f87171',
      onPress: () => router.push({ pathname: '/new', params: { type: 'expense' } }),
    },
  ];
}
