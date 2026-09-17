import { ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { categoryIconName } from '@/lib/categoryIcon';
import { formatMoney } from '@/lib/format';

export type CategorySpendingRow = { name: string; amount: number; color: string };

const MAX_CARDS = 8;

/**
 * Gastos por categoria em cards horizontais roláveis — variante visual de
 * `CategorySpendingList` (mantida à parte, ver seção 4.5 do guia de
 * migração de tema) para o redesign escuro/roxo da Home. Mesmos dados que
 * a Home já calcula, só muda a apresentação.
 */
export function CategorySpendingCards({ rows }: { rows: CategorySpendingRow[] }) {
  const top = rows.slice(0, MAX_CARDS);
  const max = Math.max(1, ...top.map((r) => r.amount));
  const restTotal = rows.slice(MAX_CARDS).reduce((sum, r) => sum + r.amount, 0);

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3"
      >
        {top.map((row) => (
          <View key={row.name} className="w-[132px] gap-2.5 rounded-[18px] bg-surface-2 p-3.5">
            <View
              className="size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${row.color}24` }}
            >
              <Feather name={categoryIconName(row.name)} size={16} color={row.color} />
            </View>
            <View className="gap-0.5">
              <Text className="text-sm font-medium" numberOfLines={1}>
                {row.name}
              </Text>
              <Text className="text-sm tabular-nums" numberOfLines={1}>
                {formatMoney(row.amount)}
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-canvas">
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
      </ScrollView>
      {restTotal > 0 ? (
        <View className="flex-row items-center justify-between gap-2 px-0.5">
          <Text variant="muted" className="text-xs">
            {t.dashboard.otherCategories(rows.length - MAX_CARDS)}
          </Text>
          <Text variant="muted" className="text-xs tabular-nums">
            {formatMoney(restTotal)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
