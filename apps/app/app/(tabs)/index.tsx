import { useMemo } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, categoriesApi, consolidatedApi, dashboardApi, transactionsApi } from '@/api';
import { TabShell } from '@/components/TabShell';
import { Badge, Card, ListRow, Money, MoneyValue, Skeleton, Stat, Text } from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort, formatMonthLabel, isInMonth, monthDateRange } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { transactionDirection } from '@/lib/transactionDisplay';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';

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
  const { activeScope, contexts } = useAuthStore();
  const month = useMonthStore((s) => s.month);
  const isConsolidated = activeScope === CONSOLIDATED;
  const contextId = isConsolidated ? null : activeScope;

  const contextLabel = isConsolidated
    ? t.dashboard.consolidatedTitle
    : (contexts.find((c) => c.id === activeScope)?.name ?? t.dashboard.title);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', activeScope, month],
    queryFn: () => dashboardApi.getDashboard(activeScope, month),
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

  const { data, isLoading, isError } = dashboardQuery;

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
              />
            </View>
            <View className="w-[47%]">
              <Stat
                label={t.dashboard.billsOverdue}
                tone={data.overdue_bills_amount > 0 ? 'negative' : 'neutral'}
                value={formatMoney(data.overdue_bills_amount)}
                hint={`${data.overdue_bills_count}`}
              />
            </View>
          </View>
        ) : null}

        {/* Contas */}
        <Card className="gap-3">
          <Text variant="title" className="text-base">
            {t.dashboard.accounts}
          </Text>
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
                <ListRow key={`${account.context_id}-${account.id}`}>
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
          <Text variant="title" className="text-base">
            {t.dashboard.recentTransactions}
          </Text>
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
                  <ListRow key={`${tx.context_id}-${tx.id}`}>
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
      </View>
    </TabShell>
  );
}
