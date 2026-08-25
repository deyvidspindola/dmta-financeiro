import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api'
import { EvolutionChart } from '@/components/EvolutionChart'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from '@/components/ui'

export function DashboardPage() {
  const { activeScope, contexts } = useAuthStore()
  const label =
    activeScope === CONSOLIDATED
      ? strings.dashboard.consolidatedTitle
      : (contexts.find((c) => c.id === activeScope)?.name ??
        strings.dashboard.title)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', activeScope],
    queryFn: () => dashboardApi.getDashboard(activeScope),
  })

  const evolutionQuery = useQuery({
    queryKey: ['dashboard-evolution', activeScope],
    queryFn: () => dashboardApi.getDashboardEvolution(activeScope, 6),
  })

  return (
    <div className="stack">
      <PageHeader title={label} description={strings.dashboard.hint} />
      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}
      {data ? (
        <div className="metric-grid">
          <Metric
            label={strings.dashboard.balance}
            value={formatMoney(data.balance_total)}
          />
          <Metric
            label={strings.dashboard.income}
            value={formatMoney(data.income_month)}
            tone="positive"
          />
          <Metric
            label={strings.dashboard.expense}
            value={formatMoney(data.expense_month)}
            tone="negative"
          />
          <Metric
            label={strings.dashboard.billsPending}
            value={`${formatMoney(data.pending_bills_amount)} (${data.pending_bills_count})`}
          />
          <Metric
            label={strings.dashboard.billsOverdue}
            value={`${formatMoney(data.overdue_bills_amount)} (${data.overdue_bills_count})`}
            tone="negative"
          />
          <Metric
            label={strings.dashboard.debtsIOwe}
            value={`${formatMoney(data.pending_debts_i_owe_amount)} (${data.pending_debts_count})`}
          />
          <Metric
            label={strings.dashboard.debtsOwedToMe}
            value={formatMoney(data.pending_debts_owed_to_me_amount)}
            tone="positive"
          />
          <Metric
            label={strings.dashboard.activeGoals}
            value={String(data.active_goals_count)}
          />
          <Metric
            label={strings.dashboard.investments}
            value={formatMoney(data.investments_total)}
          />
        </div>
      ) : null}
      {evolutionQuery.data && evolutionQuery.data.length > 0 ? (
        <Panel>
          <h2 className="panel__title">{strings.dashboard.evolution}</h2>
          <EvolutionChart series={evolutionQuery.data} />
        </Panel>
      ) : null}
      {!isLoading && !data ? (
        <EmptyState message={strings.dashboard.empty} />
      ) : null}
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative'
}) {
  const suffix = tone === 'positive' ? 'C' : tone === 'negative' ? 'D' : null

  return (
    <Panel>
      <p className="metric__label">{label}</p>
      <p className={`metric__value metric__value--${tone ?? 'neutral'}`}>
        {value}
        {suffix ? <span className="money__suffix">{suffix}</span> : null}
      </p>
    </Panel>
  )
}
