import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  accountsApi,
  budgetsApi,
  categoriesApi,
  consolidatedApi,
  dashboardApi,
  goalsApi,
  transactionsApi,
} from '@/api'
import { DashboardCardLink } from '@/components/dashboard/DashboardCardLink'
import { DashboardListItem } from '@/components/dashboard/DashboardListItem'
import { EvolutionChart } from '@/components/EvolutionChart'
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  CategoryChip,
  EmptyState,
  Money,
  MoneyValue,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Stat,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDateShort } from '@/lib/creditCardInvoices'
import { formatMonthLabel, isInMonth } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { transactionDirection } from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { useMonthStore } from '@/store/monthStore'

const t = strings.dashboard
const RECENT_LIMIT = 6

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { activeScope, contexts } = useAuthStore()
  const month = useMonthStore((s) => s.month)
  const isConsolidated = activeScope === CONSOLIDATED
  const contextId = isConsolidated ? null : activeScope

  const contextLabel = isConsolidated
    ? t.consolidatedTitle
    : (contexts.find((c) => c.id === activeScope)?.name ?? t.title)

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

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId),
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

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; colorIndex: number }>()
    for (const cat of categoriesQuery.data ?? []) {
      map.set(cat.id, { name: cat.name, colorIndex: Number(cat.id) % 12 || 1 })
    }
    return map
  }, [categoriesQuery.data])

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
  const hasDebts =
    data &&
    (data.pending_debts_count > 0 ||
      data.pending_debts_i_owe_amount > 0 ||
      data.pending_debts_owed_to_me_amount > 0)

  return (
    <div className="space-y-6 bg-canvas text-fg">
      {/* Saldo em destaque */}
      <section className="space-y-1">
        <p className="text-sm font-medium text-fg-muted">{contextLabel}</p>
        <p className="text-xs uppercase tracking-wide text-fg-subtle">
          {t.balance}
        </p>
        {isLoading ? (
          <Skeleton className="h-9 w-48" />
        ) : isError ? (
          <Alert tone="danger">{strings.common.error}</Alert>
        ) : data ? (
          <>
            <Money amount={data.balance_total} size="xl" className="font-display font-bold" />
            {isConsolidated ? (
              <p className="text-sm text-fg-muted">{t.hint}</p>
            ) : null}
            <p className="text-sm text-fg-subtle">{formatMonthLabel(month)}</p>
          </>
        ) : (
          <EmptyState message={t.empty} />
        )}
      </section>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label={t.income}
            tone="positive"
            value={
              <MoneyValue amount={data.income_month} direction="credit" size="lg" />
            }
          />
          <Stat
            label={t.expense}
            tone="negative"
            value={
              <MoneyValue amount={data.expense_month} direction="debit" size="lg" />
            }
          />
          <Stat
            label={t.billsPending}
            value={formatMoney(data.pending_bills_amount)}
            hint={`${data.pending_bills_count}`}
            onClick={() => void navigate('/bills')}
          />
          <Stat
            label={t.billsOverdue}
            tone={data.overdue_bills_amount > 0 ? 'negative' : 'neutral'}
            value={formatMoney(data.overdue_bills_amount)}
            hint={`${data.overdue_bills_count}`}
            onClick={() => void navigate('/bills')}
          />
        </div>
      ) : null}

      {/* Dívidas (discreto) */}
      {hasDebts && data ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-fg-muted">
          <span>
            {t.debtsIOwe}:{' '}
            <strong className="tabular-nums text-negative">
              {formatMoney(data.pending_debts_i_owe_amount)}
            </strong>
            {data.pending_debts_count > 0 ? (
              <span className="text-fg-subtle"> ({data.pending_debts_count})</span>
            ) : null}
          </span>
          <span>
            {t.debtsOwedToMe}:{' '}
            <strong className="tabular-nums text-positive">
              {formatMoney(data.pending_debts_owed_to_me_amount)}
            </strong>
          </span>
        </div>
      ) : null}

      {/* Evolução */}
      {evolutionQuery.isLoading ? (
        <Card>
          <Skeleton className="mb-4 h-5 w-24" />
          <Skeleton className="h-[260px] w-full" />
        </Card>
      ) : evolutionQuery.isError ? (
        <Alert tone="danger">{strings.common.error}</Alert>
      ) : evolutionQuery.data && evolutionQuery.data.length > 0 ? (
        <Card>
          <CardHeader title={t.evolution} />
          <EvolutionChart series={evolutionQuery.data} />
        </Card>
      ) : null}

      {/* Contas + lançamentos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.accounts} />
          {accountsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : accountsQuery.isError ? (
            <Alert tone="danger">{strings.common.error}</Alert>
          ) : (accountsQuery.data ?? []).length === 0 ? (
            <EmptyState message={strings.accounts.empty} />
          ) : (
            <>
              <ul className="-mx-2 divide-y divide-line">
                {(accountsQuery.data ?? []).map((account) => (
                  <li key={`${account.context_id}-${account.id}`}>
                    <DashboardListItem
                      to={`/accounts/${account.id}?context=${account.context_id}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">
                            {account.name}
                          </p>
                          {isConsolidated && account.context ? (
                            <Badge tone="neutral" className="mt-1">
                              {account.context.name}
                            </Badge>
                          ) : (
                            <p className="mt-0.5 truncate text-xs text-fg-muted">
                              {account.bank_name ??
                                strings.accounts.types[account.type]}
                            </p>
                          )}
                        </div>
                        <Money amount={account.balance} size="sm" />
                      </div>
                    </DashboardListItem>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-line pt-3">
                <Link
                  to="/accounts"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {t.viewAllAccounts}
                </Link>
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHeader title={t.recentTransactions} />
          {transactionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactionsQuery.isError ? (
            <Alert tone="danger">{strings.common.error}</Alert>
          ) : recentTransactions.length === 0 ? (
            <EmptyState message={strings.transactions.emptyMonth} />
          ) : (
            <>
              <ul className="-mx-2 divide-y divide-line">
                {recentTransactions.map((tx) => {
                  const category = tx.category_id
                    ? categoryMap.get(tx.category_id)
                    : undefined
                  return (
                    <li key={`${tx.context_id}-${tx.id}`}>
                      <DashboardListItem
                        to={`/transactions/${tx.id}?context=${tx.context_id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">
                              {tx.description}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-fg-muted">
                                {formatDateShort(tx.date)}
                              </span>
                              {category ? (
                                <CategoryChip
                                  name={category.name}
                                  colorIndex={category.colorIndex}
                                />
                              ) : null}
                            </div>
                          </div>
                          <MoneyValue
                            amount={tx.amount}
                            direction={transactionDirection(tx)}
                            size="sm"
                          />
                        </div>
                      </DashboardListItem>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-3 border-t border-line pt-3">
                <Link
                  to="/transactions"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {t.viewAll}
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Planejamento — oculto no consolidado */}
      {!isConsolidated ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardCardLink to="/budgets" ariaLabel={t.budgetsSummary}>
            <CardHeader title={t.budgetsSummary} />
            {budgetsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : budgetsQuery.isError ? (
              <Alert tone="danger">{strings.common.error}</Alert>
            ) : !budgetSummary ? (
              <EmptyState message={t.noBudgets} />
            ) : (
              <div className="space-y-3">
                <ProgressBar
                  value={budgetSummary.pct}
                  tone={budgetSummary.hasOver ? 'negative' : 'brand'}
                  label={t.budgetsSummary}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="tabular-nums">
                    {formatMoney(budgetSummary.spent)}{' '}
                    <span className="text-fg-muted">
                      {t.ofLabel} {formatMoney(budgetSummary.limit)}
                    </span>
                  </span>
                  {budgetSummary.overCount > 0 ? (
                    <span className="font-medium text-negative">
                      {t.overBudgets(budgetSummary.overCount)}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </DashboardCardLink>

          <DashboardCardLink to="/goals" ariaLabel={t.goalsSummary}>
            <CardHeader title={t.goalsSummary} />
            {goalsQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : goalsQuery.isError ? (
              <Alert tone="danger">{strings.common.error}</Alert>
            ) : activeGoals.length === 0 ? (
              <EmptyState message={t.noGoals} />
            ) : (
              <ul className="space-y-4">
                {activeGoals.map((goal) => (
                  <li key={goal.id} className="flex items-center gap-4">
                    <ProgressRing
                      value={goal.percent_complete}
                      size={52}
                      stroke={5}
                      tone="brand"
                    >
                      {goal.percent_complete}%
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-fg">{goal.name}</p>
                      <p className="text-sm tabular-nums text-fg-muted">
                        {t.goalAmount(
                          formatMoney(goal.current_amount),
                          formatMoney(goal.target_amount),
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCardLink>
        </div>
      ) : null}
    </div>
  )
}
