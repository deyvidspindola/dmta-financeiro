import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  accountsApi,
  budgetsApi,
  consolidatedApi,
  dashboardApi,
  goalsApi,
  transactionsApi,
} from '@/api'
import { EvolutionChart } from '@/components/EvolutionChart'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { isInMonth } from '@/lib/dates'
import { transactionDirection } from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { useMonthStore } from '@/store/monthStore'
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  MoneyValue,
  PageHeader,
  Panel,
} from '@/components/ui-legacy'

const RECENT_LIMIT = 6

export function DashboardPage() {
  const { activeScope, contexts } = useAuthStore()
  const month = useMonthStore((s) => s.month)
  const isConsolidated = activeScope === CONSOLIDATED
  const contextId = isConsolidated ? null : activeScope

  const label =
    isConsolidated
      ? strings.dashboard.consolidatedTitle
      : (contexts.find((c) => c.id === activeScope)?.name ??
        strings.dashboard.title)

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', activeScope],
    queryFn: () => dashboardApi.getDashboard(activeScope),
  })

  const evolutionQuery = useQuery({
    queryKey: ['dashboard-evolution', activeScope],
    queryFn: () => dashboardApi.getDashboardEvolution(activeScope, 6),
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope),
    enabled: Boolean(activeScope),
  })

  const transactionsQuery = useQuery({
    queryKey: ['transactions', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope),
    enabled: Boolean(activeScope),
  })

  const budgetsQuery = useQuery({
    queryKey: ['budgets', contextId, month],
    queryFn: () => budgetsApi.listBudgets(contextId!, month),
    enabled: Boolean(contextId),
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId!),
    enabled: Boolean(contextId),
  })

  const recentTransactions = useMemo(() => {
    const rows = transactionsQuery.data ?? []
    return rows
      .filter((tx) => isInMonth(tx.date, month))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, RECENT_LIMIT)
  }, [transactionsQuery.data, month])

  const budgetSummary = useMemo(() => {
    const rows = budgetsQuery.data ?? []
    if (rows.length === 0) return null
    const spent = rows.reduce((sum, row) => sum + row.spent, 0)
    const limit = rows.reduce((sum, row) => sum + row.limit, 0)
    const overCount = rows.filter((row) => row.over).length
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
    return { spent, limit, overCount, pct, hasOver: overCount > 0 }
  }, [budgetsQuery.data])

  const activeGoals = useMemo(() => {
    return (goalsQuery.data ?? [])
      .filter((goal) => goal.status === 'active')
      .slice(0, 3)
  }, [goalsQuery.data])

  const { data, isLoading, isError } = dashboardQuery

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
            amount={data.income_month}
            tone="positive"
          />
          <Metric
            label={strings.dashboard.expense}
            amount={data.expense_month}
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
          {!isConsolidated ? (
            <Metric
              label={strings.dashboard.activeGoals}
              value={String(data.active_goals_count)}
            />
          ) : null}
          <Metric
            label={strings.dashboard.investments}
            value={formatMoney(data.investments_total)}
          />
        </div>
      ) : null}

      <div className="dashboard-grid">
        <Panel title={strings.dashboard.accounts}>
          {accountsQuery.isLoading ? (
            <LoadingBlock label={strings.common.loading} />
          ) : null}
          {accountsQuery.isError ? (
            <ErrorBanner message={strings.common.error} />
          ) : null}
          {(accountsQuery.data ?? []).length === 0 ? (
            <EmptyState message={strings.accounts.empty} />
          ) : (
            <ul className="dash-list">
              {(accountsQuery.data ?? []).map((account) => (
                <li key={`${account.context_id}-${account.id}`}>
                  <Link
                    to={`/accounts/${account.id}?context=${account.context_id}`}
                    className="dash-list__item"
                  >
                    <span className="dash-list__main">
                      <strong>{account.name}</strong>
                      {isConsolidated && account.context ? (
                        <span className="muted small">{account.context.name}</span>
                      ) : (
                        <span className="muted small">
                          {account.bank_name ?? strings.accounts.types[account.type]}
                        </span>
                      )}
                    </span>
                    <span className="dash-list__meta mono">
                      {formatMoney(account.balance)}
                      <ChevronRight size={16} aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={strings.dashboard.recentTransactions}>
          {transactionsQuery.isLoading ? (
            <LoadingBlock label={strings.common.loading} />
          ) : null}
          {recentTransactions.length === 0 ? (
            <EmptyState message={strings.transactions.emptyMonth} />
          ) : (
            <>
              <ul className="dash-list">
                {recentTransactions.map((tx) => (
                  <li key={`${tx.context_id}-${tx.id}`}>
                    <Link
                      to={`/transactions/${tx.id}?context=${tx.context_id}`}
                      className="dash-list__item"
                    >
                      <span className="dash-list__main">
                        <strong>{tx.description}</strong>
                        <span className="muted small">{formatDate(tx.date)}</span>
                      </span>
                      <span className="dash-list__meta">
                        <MoneyValue
                          amount={tx.amount}
                          direction={transactionDirection(tx)}
                        />
                        <ChevronRight size={16} aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/transactions" className="dash-link-more">
                {strings.dashboard.viewAll}
              </Link>
            </>
          )}
        </Panel>

        {!isConsolidated ? (
          <>
            <Link to="/budgets" className="dash-card-link">
              <Panel title={strings.dashboard.budgetsSummary}>
                {budgetsQuery.isLoading ? (
                  <LoadingBlock label={strings.common.loading} />
                ) : null}
                {!budgetsQuery.isLoading && !budgetSummary ? (
                  <EmptyState message={strings.dashboard.noBudgets} />
                ) : null}
                {budgetSummary ? (
                  <>
                    <div className="budget-bar">
                      <div
                        className={`budget-bar__fill${budgetSummary.hasOver ? ' is-over' : ''}`}
                        style={{ width: `${budgetSummary.pct}%` }}
                      />
                    </div>
                    <div className="budget-card__foot">
                      <span>
                        {formatMoney(budgetSummary.spent)}{' '}
                        <span className="muted">
                          / {formatMoney(budgetSummary.limit)}
                        </span>
                      </span>
                      {budgetSummary.overCount > 0 ? (
                        <span className="negative">
                          {strings.dashboard.overBudgets(budgetSummary.overCount)}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </Panel>
            </Link>

            <Link to="/goals" className="dash-card-link">
              <Panel title={strings.dashboard.goalsSummary}>
                {goalsQuery.isLoading ? (
                  <LoadingBlock label={strings.common.loading} />
                ) : null}
                {activeGoals.length === 0 ? (
                  <EmptyState message={strings.dashboard.noGoals} />
                ) : (
                  <ul className="dash-goals">
                    {activeGoals.map((goal) => (
                      <li key={goal.id} className="dash-goals__item">
                        <div className="dash-goals__head">
                          <strong>{goal.name}</strong>
                          <span className="muted small">
                            {goal.percent_complete}%
                          </span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress__bar"
                            style={{
                              width: `${Math.min(100, Math.max(0, goal.percent_complete))}%`,
                            }}
                          />
                        </div>
                        <span className="muted small">
                          {formatMoney(goal.current_amount)} /{' '}
                          {formatMoney(goal.target_amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </Link>
          </>
        ) : null}
      </div>

      {evolutionQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
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
  amount,
  tone,
}: {
  label: string
  value?: string
  amount?: number
  tone?: 'positive' | 'negative'
}) {
  return (
    <Panel>
      <p className="metric__label">{label}</p>
      <p className={`metric__value metric__value--${tone ?? 'neutral'}`}>
        {amount !== undefined && tone ? (
          <MoneyValue
            amount={amount}
            direction={tone === 'positive' ? 'credit' : 'debit'}
          />
        ) : (
          value
        )}
      </p>
    </Panel>
  )
}
