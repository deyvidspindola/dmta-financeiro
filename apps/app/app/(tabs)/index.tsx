import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  accountsApi,
  budgetsApi,
  categoriesApi,
  consolidatedApi,
  dashboardApi,
  goalsApi,
  transactionsApi,
} from '@/api';
import { TabShell } from '@/components/TabShell';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import {
  Badge,
  Card,
  ListRow,
  Money,
  MoneyValue,
  PressableCard,
  ProgressBar,
  Skeleton,
  Stat,
  Text,
} from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort, formatMonthLabel, isInMonth, monthDateRange } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { transactionDirection } from '@/lib/transactionDisplay';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import type { StatementEntry } from '@/types/models';

const RECENT_LIMIT = 6;

function StatSkeleton() {
  return (
    <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const { activeScope, contexts } = useAuthStore();
  const month = useMonthStore((s) => s.month);
  const isConsolidated = activeScope === CONSOLIDATED;
  const contextId = isConsolidated ? null : activeScope;
  const [selected, setSelected] = useState<StatementEntry | null>(null);

  const contextLabel = isConsolidated
    ? t.dashboard.consolidatedTitle
    : (contexts.find((c) => c.id === activeScope)?.name ?? t.dashboard.title);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', activeScope, month],
    queryFn: () => dashboardApi.getDashboard(activeScope, month),
  });

  const evolutionQuery = useQuery({
    queryKey: ['dashboard-evolution', activeScope],
    queryFn: () => dashboardApi.getDashboardEvolution(activeScope, 6),
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope),
    enabled: Boolean(activeScope),
  });

  const { from, to } = monthDateRange(month);

  const transactionsQuery = useQuery({
    queryKey: ['transactions', activeScope, month],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope, { from, to }),
    enabled: Boolean(activeScope),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId),
  });

  const budgetsQuery = useQuery({
    queryKey: ['budgets', contextId, month],
    queryFn: () => budgetsApi.listBudgets(contextId!, month),
    enabled: Boolean(contextId),
  });

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId!),
    enabled: Boolean(contextId),
  });

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accountsQuery.data ?? []) map.set(account.id, account.name);
    return map;
  }, [accountsQuery.data]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesQuery.data ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const recentTransactions = useMemo(() => {
    const rows = transactionsQuery.data ?? [];
    return rows
      .filter((tx) => isInMonth(tx.date, month))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, RECENT_LIMIT);
  }, [transactionsQuery.data, month]);

  const budgetSummary = useMemo(() => {
    const rows = budgetsQuery.data ?? [];
    if (rows.length === 0) return null;
    const spent = rows.reduce((sum, row) => sum + row.spent, 0);
    const limit = rows.reduce((sum, row) => sum + row.limit, 0);
    const overCount = rows.filter((row) => row.over).length;
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    return { spent, limit, overCount, pct, hasOver: overCount > 0 };
  }, [budgetsQuery.data]);

  const activeGoals = useMemo(
    () => (goalsQuery.data ?? []).filter((goal) => goal.status === 'active').slice(0, 3),
    [goalsQuery.data],
  );

  const { data, isLoading, isError } = dashboardQuery;
  const hasDebts =
    data &&
    (data.pending_debts_count > 0 ||
      data.pending_debts_i_owe_amount > 0 ||
      data.pending_debts_owed_to_me_amount > 0);

  return (
    <TabShell>
      <View className="gap-6">
        {/* Saldo em destaque */}
        <View className="gap-1">
          <Text variant="muted">{contextLabel}</Text>
          <Text variant="muted" className="text-xs uppercase tracking-wide text-fg-subtle">
            {t.dashboard.balance}
          </Text>
          {isLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : isError ? (
            <Text variant="error">{t.common.error}</Text>
          ) : data ? (
            <>
              <Money amount={data.balance_total} size="xl" />
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
              {isConsolidated ? <Text variant="muted">{t.dashboard.hint}</Text> : null}
              <Text variant="muted" className="text-fg-subtle">
                {formatMonthLabel(month)}
              </Text>
            </>
          ) : (
            <Text variant="muted">{t.dashboard.empty}</Text>
          )}
        </View>

        {/* KPIs */}
        {isLoading ? (
          <View className="flex-row flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="w-[47%]">
                <StatSkeleton />
              </View>
            ))}
          </View>
        ) : data ? (
          <View className="flex-row flex-wrap gap-3">
            <View className="w-[47%]">
              <Stat
                label={
                  data.projected_income_month !== data.income_month
                    ? `${t.dashboard.income} ${t.dashboard.projectedLabel}`
                    : t.dashboard.income
                }
                tone="positive"
                value={
                  <MoneyValue amount={data.projected_income_month} direction="credit" size="lg" />
                }
                hint={
                  data.projected_income_month !== data.income_month
                    ? t.dashboard.effectiveHint(formatMoney(data.income_month))
                    : undefined
                }
              />
            </View>
            <View className="w-[47%]">
              <Stat
                label={
                  data.projected_expense_month !== data.expense_month
                    ? `${t.dashboard.expense} ${t.dashboard.projectedLabel}`
                    : t.dashboard.expense
                }
                tone="negative"
                value={
                  <MoneyValue amount={data.projected_expense_month} direction="debit" size="lg" />
                }
                hint={
                  data.projected_expense_month !== data.expense_month
                    ? t.dashboard.effectiveHint(formatMoney(data.expense_month))
                    : undefined
                }
              />
            </View>
            <View className="w-[47%]">
              <Stat
                label={t.dashboard.billsPending}
                value={formatMoney(data.pending_bills_amount)}
                hint={`${data.pending_bills_count}`}
                onPress={() => router.push('/bills')}
              />
            </View>
            <View className="w-[47%]">
              <Stat
                label={t.dashboard.billsOverdue}
                tone={data.overdue_bills_amount > 0 ? 'negative' : 'neutral'}
                value={formatMoney(data.overdue_bills_amount)}
                hint={`${data.overdue_bills_count}`}
                onPress={() => router.push('/bills')}
              />
            </View>
          </View>
        ) : null}

        {/* Dívidas (discreto) */}
        {hasDebts && data ? (
          <View className="flex-row flex-wrap gap-x-5 gap-y-1">
            <Text variant="muted" className="text-sm">
              {t.dashboard.debtsIOwe}:{' '}
              <Text className="font-semibold text-negative">
                {formatMoney(data.pending_debts_i_owe_amount)}
              </Text>
              {data.pending_debts_count > 0 ? (
                <Text variant="muted" className="text-fg-subtle">
                  {' '}
                  ({data.pending_debts_count})
                </Text>
              ) : null}
            </Text>
            <Text variant="muted" className="text-sm">
              {t.dashboard.debtsOwedToMe}:{' '}
              <Text className="font-semibold text-positive">
                {formatMoney(data.pending_debts_owed_to_me_amount)}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Evolução */}
        {evolutionQuery.isLoading ? (
          <Card className="gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </Card>
        ) : evolutionQuery.data && evolutionQuery.data.length > 0 ? (
          <Card className="gap-3">
            <Text variant="title" className="text-base">
              {t.dashboard.evolution}
            </Text>
            <EvolutionChart series={evolutionQuery.data} />
          </Card>
        ) : null}

        {/* Contas */}
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="title" className="text-base">
              {t.dashboard.accounts}
            </Text>
            {(accountsQuery.data ?? []).length > 0 ? (
              <Text
                variant="muted"
                className="text-xs font-medium text-brand-600 dark:text-brand-400"
                onPress={() => router.push('/accounts')}
              >
                {t.dashboard.viewAllAccounts}
              </Text>
            ) : null}
          </View>
          {accountsQuery.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </View>
          ) : accountsQuery.isError ? (
            <Text variant="error">{t.common.error}</Text>
          ) : (accountsQuery.data ?? []).length === 0 ? (
            <Text variant="muted">{t.accounts.empty}</Text>
          ) : (
            <View>
              {(accountsQuery.data ?? []).map((account) => (
                <ListRow
                  key={`${account.context_id}-${account.id}`}
                  onPress={() => router.push('/accounts')}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1 gap-1">
                      <Text className="font-medium" numberOfLines={1}>
                        {account.name}
                      </Text>
                      {isConsolidated && account.context ? (
                        <Badge tone="neutral">{account.context.name}</Badge>
                      ) : (
                        <Text variant="muted" className="text-xs" numberOfLines={1}>
                          {account.bank_name ?? t.accounts.types[account.type]}
                        </Text>
                      )}
                    </View>
                    <Money amount={account.balance} size="sm" />
                  </View>
                </ListRow>
              ))}
            </View>
          )}
        </Card>

        {/* Últimos lançamentos */}
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="title" className="text-base">
              {t.dashboard.recentTransactions}
            </Text>
            {recentTransactions.length > 0 ? (
              <Text
                variant="muted"
                className="text-xs font-medium text-brand-600 dark:text-brand-400"
                onPress={() => router.push('/transactions')}
              >
                {t.dashboard.viewAll}
              </Text>
            ) : null}
          </View>
          {transactionsQuery.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </View>
          ) : transactionsQuery.isError ? (
            <Text variant="error">{t.common.error}</Text>
          ) : recentTransactions.length === 0 ? (
            <Text variant="muted">{t.transactions.emptyMonth}</Text>
          ) : (
            <View>
              {recentTransactions.map((tx) => {
                const categoryName = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
                return (
                  <ListRow key={`${tx.context_id}-${tx.id}`} onPress={() => setSelected(tx)}>
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Text className="font-medium" numberOfLines={1}>
                          {tx.description}
                        </Text>
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text variant="muted" className="text-xs">
                            {formatDateShort(tx.date)}
                          </Text>
                          {categoryName ? (
                            <Text variant="muted" className="text-xs">
                              {categoryName}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <MoneyValue
                        amount={tx.amount}
                        direction={transactionDirection(tx)}
                        size="sm"
                      />
                    </View>
                  </ListRow>
                );
              })}
            </View>
          )}
        </Card>

        {/* Planejamento — oculto no consolidado */}
        {!isConsolidated ? (
          <View className="gap-3">
            <PressableCard onPress={() => router.push('/budgets')} className="gap-3">
              <Text variant="title" className="text-base">
                {t.dashboard.budgetsSummary}
              </Text>
              {budgetsQuery.isLoading ? (
                <View className="gap-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-40" />
                </View>
              ) : !budgetSummary ? (
                <Text variant="muted">{t.dashboard.noBudgets}</Text>
              ) : (
                <View className="gap-2">
                  <ProgressBar
                    value={budgetSummary.pct}
                    tone={budgetSummary.hasOver ? 'negative' : 'brand'}
                  />
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <Text className="text-sm">
                      {formatMoney(budgetSummary.spent)}{' '}
                      <Text variant="muted">
                        {t.dashboard.ofLabel} {formatMoney(budgetSummary.limit)}
                      </Text>
                    </Text>
                    {budgetSummary.overCount > 0 ? (
                      <Text className="text-sm font-medium text-negative">
                        {t.dashboard.overBudgets(budgetSummary.overCount)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            </PressableCard>

            <PressableCard onPress={() => router.push('/goals')} className="gap-3">
              <Text variant="title" className="text-base">
                {t.dashboard.goalsSummary}
              </Text>
              {goalsQuery.isLoading ? (
                <View className="gap-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </View>
              ) : activeGoals.length === 0 ? (
                <Text variant="muted">{t.dashboard.noGoals}</Text>
              ) : (
                <View className="gap-3">
                  {activeGoals.map((goal) => (
                    <View key={goal.id} className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 font-medium" numberOfLines={1}>
                          {goal.name}
                        </Text>
                        <Text variant="muted" className="text-xs">
                          {goal.percent_complete}%
                        </Text>
                      </View>
                      <ProgressBar value={goal.percent_complete} tone="brand" />
                      <Text variant="muted" className="text-xs">
                        {t.dashboard.goalAmount(
                          formatMoney(goal.current_amount),
                          formatMoney(goal.target_amount),
                        )}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </PressableCard>
          </View>
        ) : null}
      </View>

      <TransactionDetailSheet
        entry={selected}
        contextId={contextId}
        accountName={selected ? accountMap.get(selected.account_id) : undefined}
        categoryName={selected?.category_id ? categoryMap.get(selected.category_id) : undefined}
        onClose={() => setSelected(null)}
      />
    </TabShell>
  );
}
