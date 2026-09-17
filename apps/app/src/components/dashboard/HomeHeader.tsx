import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Money, MoneyValue, Skeleton, Text } from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { currentMonthKey, formatMonthLabel } from '@/lib/dates';
import { useMonthStore } from '@/store/monthStore';
import type { DashboardSummary } from '@/types/models';

// Feather não resolve `className` (sem cssInterop configurado neste app —
// ver MonthNavigator.tsx pro mesmo padrão), então os ícones aqui pegam cor
// literal por tema.
const ICON_COLORS = {
  light: { muted: '#48605a', subtle: '#7c918b' },
  dark: { muted: '#8d8aa3', subtle: '#6e6b82' },
} as const;

/** Círculo + valor — resumo de receita/despesa do mês, dentro do hero. */
function DirectionSummary({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: 'positive' | 'negative';
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2">
      <View
        className={cn(
          'size-9 items-center justify-center rounded-full',
          tone === 'positive' ? 'bg-positive' : 'bg-negative',
        )}
      >
        <Feather name={tone === 'positive' ? 'arrow-up' : 'arrow-down'} size={16} color="#fff" />
      </View>
      <View className="min-w-0 flex-1">
        <Text variant="muted" className="text-xs" numberOfLines={1}>
          {label}
        </Text>
        <MoneyValue
          amount={amount}
          direction={tone === 'positive' ? 'credit' : 'debit'}
          size="md"
        />
      </View>
    </View>
  );
}

type HomeHeaderProps = {
  contextLabel: string;
  isConsolidated: boolean;
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  isLoading: boolean;
  isError: boolean;
  data?: DashboardSummary;
};

/**
 * Painel fixo no topo da Home (fora do scroll) — avatar do contexto ativo,
 * mês corrente e sino de notificação na primeira linha; saldo centralizado
 * e o resumo de receita/despesa do mês embaixo. Ver seção 4.1 do guia de
 * migração de tema (redesign escuro/roxo).
 */
export function HomeHeader({
  contextLabel,
  isConsolidated,
  hideBalance,
  onToggleHideBalance,
  isLoading,
  isError,
  data,
}: HomeHeaderProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? ICON_COLORS.dark : ICON_COLORS.light;
  const month = useMonthStore((s) => s.month);
  const resetMonth = useMonthStore((s) => s.reset);
  const isCurrentMonth = month === currentMonthKey();
  const initial = (contextLabel.trim().charAt(0) || '?').toUpperCase();

  return (
    <View className="items-center gap-5 rounded-b-[28px] bg-surface px-5 pb-6 pt-4">
      <View className="w-full flex-row items-center justify-between">
        <View className="size-9 items-center justify-center rounded-full bg-accent-600">
          <Text className="text-sm font-semibold text-white">{initial}</Text>
        </View>

        <Pressable
          accessibilityLabel={isCurrentMonth ? formatMonthLabel(month) : t.monthNav.backToCurrent}
          onPress={resetMonth}
          className="flex-row items-center gap-1 rounded-lg px-2 py-1 active:bg-surface-2"
        >
          <Text className="text-sm font-medium">{formatMonthLabel(month)}</Text>
          <Feather name="chevron-down" size={16} color={palette.muted} />
        </Pressable>

        <Pressable
          accessibilityLabel={t.nav.notifications}
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          className="size-9 items-center justify-center rounded-full bg-surface-2"
        >
          <Feather name="bell" size={16} color={palette.muted} />
        </Pressable>
      </View>

      <View className="items-center gap-1">
        <Pressable
          accessibilityLabel={hideBalance ? t.dashboard.showBalance : t.dashboard.hideBalance}
          onPress={onToggleHideBalance}
          hitSlop={8}
          className="flex-row items-center gap-2 p-1"
        >
          <Text variant="muted" className="text-xs uppercase tracking-wide text-fg-subtle">
            {t.dashboard.balance}
          </Text>
          <Feather name={hideBalance ? 'eye-off' : 'eye'} size={14} color={palette.subtle} />
        </Pressable>

        {isLoading ? (
          <Skeleton className="h-10 w-48" />
        ) : isError ? (
          <Text variant="error">{t.common.error}</Text>
        ) : data ? (
          hideBalance ? (
            <Text className="text-4xl font-bold tabular-nums text-fg">
              {t.dashboard.hiddenBalance}
            </Text>
          ) : (
            <View className="items-center gap-1">
              <Money amount={data.balance_total} className="text-4xl" />
              {data.provisioned_balance_total !== data.balance_total ? (
                <View className="flex-row items-baseline gap-1.5">
                  <Text variant="muted" className="text-xs">
                    {t.dashboard.balanceProvisioned}
                  </Text>
                  <Money amount={data.provisioned_balance_total} size="sm" />
                  <Text variant="muted" className="text-xs text-fg-subtle">
                    {t.dashboard.balanceProvisionedHint}
                  </Text>
                </View>
              ) : null}
            </View>
          )
        ) : (
          <Text variant="muted">{t.dashboard.empty}</Text>
        )}
        {isConsolidated ? <Text variant="muted">{t.dashboard.hint}</Text> : null}
      </View>

      {data ? (
        <View className="w-full flex-row items-center gap-4">
          <DirectionSummary
            label={
              data.projected_income_month !== data.income_month
                ? `${t.dashboard.income} ${t.dashboard.projectedLabel}`
                : t.dashboard.income
            }
            amount={data.projected_income_month}
            tone="positive"
          />
          <View className="h-8 w-px bg-line" />
          <DirectionSummary
            label={
              data.projected_expense_month !== data.expense_month
                ? `${t.dashboard.expense} ${t.dashboard.projectedLabel}`
                : t.dashboard.expense
            }
            amount={data.projected_expense_month}
            tone="negative"
          />
        </View>
      ) : null}
    </View>
  );
}
