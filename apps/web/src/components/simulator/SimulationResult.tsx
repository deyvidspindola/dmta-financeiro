import { useMemo } from 'react'
import {
  Badge,
  BarChart,
  Money,
  Panel,
  ProgressBar,
  Stat,
  useChartPalette,
} from '@/components/ui'
import { buildInstallmentImpactSeries } from '@/components/simulator/buildMonthlyProjection'
import {
  SIMULATION_STATUS_RING,
  SIMULATION_STATUS_TONE,
} from '@/components/simulator/simulationStatus'
import { strings } from '@/i18n/pt-BR'
import { formatMonthLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { InstallmentPurchaseSimulation } from '@/types/models'

const t = strings.simulator

type SimulationResultProps = {
  result: InstallmentPurchaseSimulation
  installments: number
}

export function SimulationResultView({
  result,
  installments,
}: SimulationResultProps) {
  const palette = useChartPalette()
  const chart = useMemo(
    () => buildInstallmentImpactSeries(result, installments),
    [result, installments],
  )

  const commitment = result.commitment_percent ?? 0

  return (
    <div className="mt-5 space-y-5 border-t border-line pt-5">
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-4 py-6 text-center',
          SIMULATION_STATUS_RING[result.status],
        )}
        role="status"
        aria-label={t.statuses[result.status]}
      >
        <Badge tone={SIMULATION_STATUS_TONE[result.status]} dot>
          {t.statuses[result.status]}
        </Badge>
        <p className="text-sm font-medium">{t.commitmentResult(commitment)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label={t.installment}
          value={<Money amount={result.installment_amount} size="lg" />}
          tone="brand"
        />
        <Stat
          label={t.freeBudget}
          value={formatMoney(result.free_budget)}
        />
        <Stat
          label={t.fitsNow}
          value={result.fits_now ? t.yes : t.no}
          tone={result.fits_now ? 'positive' : 'negative'}
        />
        <Stat
          label={t.fitsFrom}
          value={
            result.fits_from_month
              ? formatMonthLabel(result.fits_from_month)
              : t.neverFits
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">{t.commitment}</span>
          <span className="font-medium tabular-nums text-fg">
            {result.commitment_percent === null
              ? '—'
              : `${result.commitment_percent}%`}
          </span>
        </div>
        <ProgressBar
          value={commitment}
          tone={
            result.status === 'green'
              ? 'positive'
              : result.status === 'yellow'
                ? 'warning'
                : 'negative'
          }
          label={t.commitment}
        />
      </div>

      <Panel title={t.impactChart}>
        <BarChart
          categories={chart.categories}
          series={[
            {
              name: t.freeBudgetAfterInstallment,
              data: chart.values,
              color: palette.brand,
            },
          ]}
          height={220}
        />
      </Panel>

      <p className="text-sm text-fg-muted">
        {t.tightest}: {formatMonthLabel(result.tightest_month.month)} ·{' '}
        {formatMoney(result.tightest_month.free_budget)}
        {result.tightest_month.commitment_percent !== null
          ? ` · ${result.tightest_month.commitment_percent}%`
          : ''}
      </p>

      {result.total_cost !== null || result.annual_cet !== null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.total_cost !== null ? (
            <Stat
              label={t.totalCost}
              value={formatMoney(result.total_cost)}
              tone="negative"
            />
          ) : null}
          {result.annual_cet !== null ? (
            <Stat
              label={t.cet}
              value={`${result.annual_cet}%`}
              tone="brand"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
