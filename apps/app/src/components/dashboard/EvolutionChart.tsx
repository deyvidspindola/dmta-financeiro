import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatMonthShort } from '@/lib/dates';
import type { EvolutionPoint } from '@/types/models';

const BAR_MAX_HEIGHT = 84;

/**
 * Evolução receita×despesa em barras — versão NativeWind do `EvolutionChart`
 * do apps/web (lá é ApexCharts, DT-11 diz que não vale a pena pro RN). Sem
 * lib nova: duas barras por mês escaladas em px contra o maior valor da
 * série, altura mínima de 2px pra barra zerada não sumir do layout.
 */
export function EvolutionChart({ series }: { series: EvolutionPoint[] }) {
  const max = Math.max(1, ...series.flatMap((p) => [p.income, p.expense]));

  return (
    <View className="flex-row items-end justify-between gap-1">
      {series.map((point) => {
        const incomeHeight = Math.max(2, Math.round((point.income / max) * BAR_MAX_HEIGHT));
        const expenseHeight = Math.max(2, Math.round((point.expense / max) * BAR_MAX_HEIGHT));
        return (
          <View key={point.month} className="flex-1 items-center gap-1.5">
            <View className="flex-row items-end gap-1" style={{ height: BAR_MAX_HEIGHT }}>
              <View className="w-2.5 rounded-t-sm bg-positive" style={{ height: incomeHeight }} />
              <View className="w-2.5 rounded-t-sm bg-negative" style={{ height: expenseHeight }} />
            </View>
            <Text variant="muted" className="text-[10px]">
              {formatMonthShort(point.month)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
