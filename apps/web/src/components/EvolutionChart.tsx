import { BarChart, useChartPalette } from '@/components/ui'
import type { EvolutionPoint } from '@/types/models'
import { strings } from '@/i18n/pt-BR'
import { formatMonthShort } from '@/lib/dates'

/**
 * Evolução mensal receita × despesa (barras). Recebe a série do
 * `GET .../dashboard/evolution`. Vazio → não renderiza.
 */
export function EvolutionChart({ series }: { series: EvolutionPoint[] }) {
  const palette = useChartPalette()
  if (series.length === 0) return null

  return (
    <div role="img" aria-label={strings.dashboard.evolution}>
      <BarChart
        height={260}
        categories={series.map((p) => formatMonthShort(p.month))}
        series={[
          {
            name: strings.dashboard.income,
            data: series.map((p) => p.income),
            color: palette.positive,
          },
          {
            name: strings.dashboard.expense,
            data: series.map((p) => p.expense),
            color: palette.negative,
          },
        ]}
      />
    </div>
  )
}
