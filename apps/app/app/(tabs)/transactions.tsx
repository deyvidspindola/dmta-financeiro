import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, categoriesApi, consolidatedApi, transactionsApi } from '@/api';
import { TabShell } from '@/components/TabShell';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import { Card, ListRow, Money, MoneyValue, Skeleton, Text } from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateShort, isInMonth, monthDateRange } from '@/lib/dates';
import { transactionDirection } from '@/lib/transactionDisplay';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import type { EntryType, StatementEntry } from '@/types/models';

type Filter = 'all' | 'income' | 'expense';
const FILTERS: Filter[] = ['all', 'income', 'expense'];

function matchesFilter(entry: StatementEntry, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'income') return entry.type === 'income';
  return entry.type === 'expense' || entry.type === 'transfer';
}

function groupByDay(entries: StatementEntry[]): { date: string; rows: StatementEntry[] }[] {
  const map = new Map<string, StatementEntry[]>();
  for (const entry of entries) {
    const bucket = map.get(entry.date) ?? [];
    bucket.push(entry);
    map.set(entry.date, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, rows]) => ({ date, rows }));
}

export default function TransactionsTab() {
  const activeScope = useAuthStore((s) => s.activeScope);
  const month = useMonthStore((s) => s.month);
  const isConsolidated = activeScope === CONSOLIDATED;
  const contextId = isConsolidated ? null : activeScope;
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<StatementEntry | null>(null);

  const { from, to } = monthDateRange(month);

  const transactionsQuery = useQuery({
    queryKey: ['transactions', activeScope, month],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope, { from, to }),
    enabled: Boolean(activeScope),
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope),
    enabled: Boolean(activeScope),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId),
  });

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accountsQuery.data ?? []) map.set(account.id, account.name);
    return map;
  }, [accountsQuery.data]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesQuery.data ?? []) map.set(cat.id, cat.name);
    return map;
  }, [categoriesQuery.data]);

  const monthEntries = useMemo(
    () =>
      (transactionsQuery.data ?? [])
        .filter((tx) => isInMonth(tx.date, month))
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [transactionsQuery.data, month],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of monthEntries) {
      if (tx.type === 'income') income += Math.abs(tx.amount);
      else if (tx.type === 'expense') expense += Math.abs(tx.amount);
    }
    return { income, expense, net: income - expense };
  }, [monthEntries]);

  const groups = useMemo(
    () => groupByDay(monthEntries.filter((tx) => matchesFilter(tx, filter))),
    [monthEntries, filter],
  );

  const filterLabel = (f: Filter) =>
    f === 'all' ? t.transactions.filters.all : t.transactions.types[f as EntryType];

  const { isLoading, isError } = transactionsQuery;

  return (
    <TabShell>
      <View className="gap-4">
        {/* Resumo do mês */}
        <Card className="flex-row justify-between">
          <View className="gap-0.5">
            <Text variant="muted" className="text-xs">{t.transactions.monthIn}</Text>
            <MoneyValue amount={totals.income} direction="credit" size="md" />
          </View>
          <View className="gap-0.5">
            <Text variant="muted" className="text-xs">{t.transactions.monthOut}</Text>
            <MoneyValue amount={totals.expense} direction="debit" size="md" />
          </View>
          <View className="items-end gap-0.5">
            <Text variant="muted" className="text-xs">{t.transactions.monthNet}</Text>
            <Money amount={totals.net} size="md" />
          </View>
        </Card>

        {/* Filtro entradas/saídas */}
        <View className="flex-row rounded-xl border border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={cn(
                'flex-1 items-center rounded-lg py-2',
                filter === f && 'bg-canvas',
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  filter === f ? 'font-semibold text-fg' : 'text-fg-muted',
                )}
              >
                {filterLabel(f)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Lista */}
        {isLoading ? (
          <View className="gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </View>
        ) : isError ? (
          <Text variant="error">{t.common.error}</Text>
        ) : groups.length === 0 ? (
          <Text variant="muted">
            {filter === 'all' ? t.transactions.emptyMonth : t.transactions.emptyFilter}
          </Text>
        ) : (
          <View className="gap-4">
            {groups.map((group) => (
              <View key={group.date}>
                <Text variant="muted" className="mb-1 text-xs uppercase tracking-wide">
                  {formatDateShort(group.date)}
                </Text>
                <Card className="gap-0 py-0">
                  {group.rows.map((tx) => {
                    const categoryName = tx.category_id
                      ? categoryMap.get(tx.category_id)
                      : undefined;
                    return (
                      <ListRow key={`${tx.context_id}-${tx.id}`} onPress={() => setSelected(tx)}>
                        <View className="flex-row items-center justify-between gap-3">
                          <View className="min-w-0 flex-1 gap-0.5">
                            <Text className="font-medium" numberOfLines={1}>
                              {tx.description}
                            </Text>
                            <Text variant="muted" className="text-xs" numberOfLines={1}>
                              {categoryName ?? accountMap.get(tx.account_id) ?? ''}
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

      <TransactionDetailSheet
        entry={selected}
        accountName={selected ? accountMap.get(selected.account_id) : undefined}
        categoryName={
          selected?.category_id ? categoryMap.get(selected.category_id) : undefined
        }
        onClose={() => setSelected(null)}
      />
    </TabShell>
  );
}
