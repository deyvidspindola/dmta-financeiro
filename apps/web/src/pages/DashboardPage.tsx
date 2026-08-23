import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api'
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
            value={`${formatMoney(data.bills_pending_amount)} (${data.bills_pending_count})`}
          />
          <Metric
            label={strings.dashboard.investments}
            value={formatMoney(data.investments_total)}
          />
        </div>
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
  // Mesma convenção de extrato do resto do app: C pra entrada (positive),
  // D pra saída (negative) — ver MoneyValue em components/ui.tsx.
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
