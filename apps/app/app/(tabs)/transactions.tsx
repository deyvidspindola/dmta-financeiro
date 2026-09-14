import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, categoriesApi, consolidatedApi, transactionsApi } from '@/api';
import { TabShell } from '@/components/TabShell';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import {
  Badge,
  Card,
  ListRow,
  Money,
  MoneyValue,
  SelectField,
  Skeleton,
  Text,
} from '@/components/ui';
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
  const [search, setSearch] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
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

  const accountOptions = useMemo(
    () => [
      { value: '', label: t.transactions.filters.allAccounts },
      ...(accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    ],
    [accountsQuery.data],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.transactions.filters.allCategories },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

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

  const hasActiveFilters = search.trim().length > 0 || accountId !== null || categoryId !== null;

  // Filtro é local — o mês inteiro já está em memória (mesma query de
  // sempre), então busca/conta/categoria não precisam de ida-e-volta nova
  // à API. Funciona igual no Consolidado, onde o endpoint não aceita
  // filtro nenhum no servidor.
  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groupByDay(
      monthEntries.filter((tx) => {
        if (!matchesFilter(tx, filter)) return false;
        if (accountId && tx.account_id !== accountId) return false;
        if (categoryId && tx.category_id !== categoryId) return false;
        if (needle && !tx.description.toLowerCase().includes(needle)) return false;
        return true;
      }),
    );
  }, [monthEntries, filter, accountId, categoryId, search]);

  const filterLabel = (f: Filter) =>
    f === 'all' ? t.transactions.filters.all : t.transactions.types[f as EntryType];

  const { isLoading, isError } = transactionsQuery;

  return (
    <TabShell>
      <View className="gap-4">
        {/* Resumo do mês */}
        <Card className="flex-row justify-between">
          <View className="gap-0.5">
            <Text variant="muted" className="text-xs">
              {t.transactions.monthIn}
            </Text>
            <MoneyValue amount={totals.income} direction="credit" size="md" />
          </View>
          <View className="gap-0.5">
            <Text variant="muted" className="text-xs">
              {t.transactions.monthOut}
            </Text>
            <MoneyValue amount={totals.expense} direction="debit" size="md" />
          </View>
          <View className="items-end gap-0.5">
            <Text variant="muted" className="text-xs">
              {t.transactions.monthNet}
            </Text>
            <Money amount={totals.net} size="md" />
          </View>
        </Card>

        {/* Busca */}
        <View className="h-12 flex-row items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <Feather name="search" size={16} color="#7c918b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.transactions.filters.searchPlaceholder}
            placeholderTextColor="#7c918b"
            className="h-full flex-1 text-base text-fg"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={16} color="#7c918b" />
            </Pressable>
          ) : null}
        </View>

        {/* Conta / categoria */}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <SelectField
              label={t.transactions.account}
              placeholder={t.transactions.filters.allAccounts}
              value={accountId ?? ''}
              options={accountOptions}
              onChange={(v) => setAccountId(v || null)}
            />
          </View>
          {!isConsolidated ? (
            <View className="flex-1">
              <SelectField
                label={t.transactions.category}
                placeholder={t.transactions.filters.allCategories}
                value={categoryId ?? ''}
                options={categoryOptions}
                onChange={(v) => setCategoryId(v || null)}
              />
            </View>
          ) : null}
        </View>

        {/* Filtro entradas/saídas */}
        <View className="flex-row rounded-xl border border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={cn('flex-1 items-center rounded-lg py-2', filter === f && 'bg-canvas')}
            >
              <Text
                className={cn('text-sm', filter === f ? 'font-semibold text-fg' : 'text-fg-muted')}
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
            {filter === 'all' && !hasActiveFilters
              ? t.transactions.emptyMonth
              : t.transactions.emptyFilter}
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
                    const pending = tx.status === 'pending';
                    return (
                      <ListRow key={`${tx.context_id}-${tx.id}`} onPress={() => setSelected(tx)}>
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
        contextId={contextId}
        accountName={selected ? accountMap.get(selected.account_id) : undefined}
        categoryName={selected?.category_id ? categoryMap.get(selected.category_id) : undefined}
        onClose={() => setSelected(null)}
      />
    </TabShell>
  );
}
