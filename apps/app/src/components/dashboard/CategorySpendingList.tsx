import { View } from 'react-native';
import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';

export type CategorySpendingRow = { name: string; amount: number; color: string };

const MAX_ROWS = 6;

/**
 * Gastos por categoria em barras — versão NativeWind do `DonutChart` do
 * apps/web (ApexCharts não vale pro RN, DT-11). Rosca não cabe bem numa
 * tela estreita com legenda; barra ranqueada lê melhor no celular e usa a
 * mesma paleta cat-1..12 (categoryColor.ts).
 */
export function CategorySpendingList({ rows }: { rows: CategorySpendingRow[] }) {
  const top = rows.slice(0, MAX_ROWS);
  const max = Math.max(1, ...top.map((r) => r.amount));
  const restTotal = rows.slice(MAX_ROWS).reduce((sum, r) => sum + r.amount, 0);

  return (
    <View className="gap-3">
      {top.map((row) => (
        <View key={row.name} className="gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
              <View className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
              <Text className="min-w-0 flex-1 text-sm" numberOfLines={1}>
                {row.name}
              </Text>
            </View>
            <Text className="text-sm tabular-nums">{formatMoney(row.amount)}</Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, (row.amount / max) * 100)}%`,
                backgroundColor: row.color,
              }}
            />
          </View>
        </View>
      ))}
      {restTotal > 0 ? (
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="muted" className="text-xs">
            {t.dashboard.otherCategories(rows.length - MAX_ROWS)}
          </Text>
          <Text variant="muted" className="text-xs tabular-nums">
            {formatMoney(restTotal)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
