import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, categoriesApi, transactionsApi } from '@/api';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import { Badge, Card, ListRow, Money, MoneyValue, Screen, Skeleton, Text } from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateShort, formatMonthLabel, monthDateRange } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { transactionBalanceEffect, transactionDirection } from '@/lib/transactionDisplay';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { useMonthStore } from '@/store/monthStore';
import type { StatementEntry } from '@/types/models';

type StatementLine = { tx: StatementEntry; runningBalance: number };

function buildStatement(startingBalance: number, transactions: StatementEntry[]): StatementLine[] {
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  let running = startingBalance;
  return sorted.map((tx) => {
    const row = { tx, runningBalance: running };
    running -= transactionBalanceEffect(tx);
    return row;
  });
}

function groupByDay(rows: StatementLine[]): { date: string; rows: StatementLine[] }[] {
  const map = new Map<string, StatementLine[]>();
  for (const row of rows) {
    const bucket = map.get(row.tx.date) ?? [];
    bucket.push(row);
    map.set(row.tx.date, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, rows]) => ({ date, rows }));
}

export default function AccountDetailScreen() {
  const router = useRouter();
  const sessionRoute = useSessionRoute();
  const { id, contextId } = useLocalSearchParams<{ id: string; contextId: string }>();
  const month = useMonthStore((s) => s.month);
  const [selected, setSelected] = useState<StatementEntry | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: Boolean(contextId),
  });
  const account = accountsQuery.data?.find((a) => a.id === id) ?? null;

  const { from, to } = monthDateRange(month);
  const transactionsQuery = useQuery({
    queryKey: ['transactions', contextId, month, 'account', id],
    queryFn: () => transactionsApi.listTransactions(contextId, { account_id: id, from, to }),
    enabled: Boolean(contextId) && Boolean(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId),
    enabled: Boolean(contextId),
  });
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesQuery.data ?? []) map.set(cat.id, cat.name);
    return map;
  }, [categoriesQuery.data]);

  // O extrato do mês termina no saldo atual da conta — a partir dele,
  // "desfaz" cada lançamento (mais recente primeiro) pra reconstruir o
  // saldo de antes de cada um. Mesma conta do apps/web (AccountStatement).
  const groups = useMemo(() => {
    if (!account) return [];
    return groupByDay(buildStatement(account.balance, transactionsQuery.data ?? []));
  }, [account, transactionsQuery.data]);

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title" numberOfLines={1}>
          {account?.name ?? t.accountDetail.title}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {accountsQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !account ? (
        <Text variant="muted">{t.accountDetail.notFound}</Text>
      ) : (
        <View className="gap-4">
          <Card className="gap-1">
            <Text variant="muted" className="text-xs uppercase tracking-wide text-fg-subtle">
              {t.accountDetail.currentBalance}
            </Text>
            <Money amount={account.balance} size="xl" />
            <Text variant="muted" className="text-xs" numberOfLines={1}>
              {account.bank_name ?? t.accounts.types[account.type]}
            </Text>
          </Card>

          <View className="flex-row items-center justify-between">
            <Text variant="title" className="text-base">
              {t.accountDetail.statement}
            </Text>
            <Text variant="muted" className="text-xs">
              {formatMonthLabel(month)}
            </Text>
          </View>

          {transactionsQuery.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </View>
          ) : transactionsQuery.isError ? (
            <Text variant="error">{t.common.error}</Text>
          ) : groups.length === 0 ? (
            <Text variant="muted">{t.accountDetail.emptyStatement}</Text>
          ) : (
            <View className="gap-4">
              {groups.map((group) => (
                <View key={group.date}>
                  <Text variant="muted" className="mb-1 text-xs uppercase tracking-wide">
                    {formatDateShort(group.date)}
                  </Text>
                  <Card className="gap-0 py-0">
                    {group.rows.map(({ tx, runningBalance }) => {
                      const pending = tx.status === 'pending';
                      return (
                        <ListRow key={tx.id} onPress={() => setSelected(tx)}>
                          <View
                            className={cn(
                              'flex-row items-center justify-between gap-3',
                              pending && 'opacity-60',
                            )}
                          >
                            <View className="min-w-0 flex-1 gap-0.5">
                              <View className="flex-row items-center gap-2">
                                <Text className="font-medium" numberOfLines={1}>
                                  {tx.description}
                                </Text>
                                {pending ? (
                                  <Badge tone="warning">{t.transactions.pendingBadge}</Badge>
                                ) : null}
                              </View>
                              <Text variant="muted" className="text-xs" numberOfLines={1}>
                                {t.accountDetail.runningBalance} {formatMoney(runningBalance)}
                              </Text>
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
                  </Card>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TransactionDetailSheet
        entry={selected}
        contextId={contextId ?? null}
        accountName={account?.name}
        categoryName={selected?.category_id ? categoryMap.get(selected.category_id) : undefined}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}
