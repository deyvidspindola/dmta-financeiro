import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, categoriesApi, consolidatedApi, transactionsApi } from '@/api';
import { TabShell } from '@/components/TabShell';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import {
  Badge,
  Card,
  CategoryIcon,
  ListRow,
  Money,
  MoneyValue,
  Skeleton,
  Text,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateShort, isInMonth, monthDateRange } from '@/lib/dates';
import { transactionDirection } from '@/lib/transactionDisplay';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import {
  hasActiveTransactionFilters,
  useTransactionFilterStore,
} from '@/store/transactionFilterStore';
import type { StatementEntry } from '@/types/models';

function dayGroupLabel(iso: string): string {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (iso === todayKey) return t.common.today;
  if (iso === yesterdayKey) return t.common.yesterday;
  return formatDateShort(iso);
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

/** Círculo de ícone da linha — transferência tem cor/ícone fixos (não tem categoria); o resto usa `CategoryIcon`. */
function TransactionLeadingIcon({
  tx,
  categoryName,
}: {
  tx: StatementEntry;
  categoryName: string | undefined;
}) {
  if (tx.type === 'transfer') {
    const incoming = transactionDirection(tx) === 'credit';
    return (
      <View
        className="size-9 items-center justify-center rounded-full"
        style={{ backgroundColor: incoming ? '#3b82f6' : '#ef4444' }}
      >
        <Feather name="repeat" size={16} color="#fff" />
      </View>
    );
  }
  return (
    <CategoryIcon
      categoryId={tx.category_id}
      name={categoryName ?? t.newTransaction.categoryNone}
      size="sm"
    />
  );
}

export default function TransactionsTab() {
  const router = useRouter();
  const activeScope = useAuthStore((s) => s.activeScope);
  const month = useMonthStore((s) => s.month);
  const isConsolidated = activeScope === CONSOLIDATED;
  const contextId = isConsolidated ? null : activeScope;

  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StatementEntry | null>(null);

  const filters = useTransactionFilterStore();
  const filtersActive = hasActiveTransactionFilters(filters);

  const monthRange = monthDateRange(month);
  const listRange = filters.useCustomPeriod
    ? { from: filters.periodFrom ?? monthRange.from, to: filters.periodTo ?? monthRange.to }
    : monthRange;

  // Resumo do card sempre reflete o mês do navegador, mesmo com período
  // customizado ativo na lista abaixo — são dois recortes diferentes.
  const monthTotalsQuery = useQuery({
    queryKey: ['transactions', activeScope, month, 'month-totals'],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope, monthRange),
    enabled: Boolean(activeScope),
  });

  const listQuery = useQuery({
    queryKey: ['transactions', activeScope, listRange.from, listRange.to],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope, listRange),
    enabled: Boolean(activeScope) && filters.useCustomPeriod,
  });

  const transactionsQuery = filters.useCustomPeriod ? listQuery : monthTotalsQuery;

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope, month],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope, month),
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

  const currentBalance = useMemo(
    () => (accountsQuery.data ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accountsQuery.data],
  );

  const monthlyBalance = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of monthTotalsQuery.data ?? []) {
      if (tx.status !== 'settled' || !isInMonth(tx.date, month)) continue;
      if (tx.type === 'income') income += Math.abs(tx.amount);
      else if (tx.type === 'expense') expense += Math.abs(tx.amount);
    }
    return income - expense;
  }, [monthTotalsQuery.data, month]);

  // Consolidado não aceita filtro de data no servidor (o endpoint devolve
  // tudo) — sem período customizado, escopa pro mês aqui; com período
  // customizado, `listRange` já é o recorte que o usuário escolheu.
  const sortedEntries = useMemo(() => {
    const rows = transactionsQuery.data ?? [];
    const scoped = filters.useCustomPeriod
      ? rows.filter((tx) => tx.date >= listRange.from && tx.date <= listRange.to)
      : rows.filter((tx) => isInMonth(tx.date, month));
    return [...scoped].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [transactionsQuery.data, filters.useCustomPeriod, listRange.from, listRange.to, month]);

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groupByDay(
      sortedEntries.filter((tx) => {
        if (filters.status !== 'all' && tx.status !== filters.status) return false;
        if (filters.accountId && tx.account_id !== filters.accountId) return false;
        if (filters.categoryId && tx.category_id !== filters.categoryId) return false;
        if (needle && !tx.description.toLowerCase().includes(needle)) return false;
        return true;
      }),
    );
  }, [sortedEntries, filters, search]);

  const { isLoading, isError } = transactionsQuery;
  const isEmptyDueToFilter = search.trim().length > 0 || filtersActive;

  return (
    <TabShell
      title={t.nav.transactions}
      headerRight={
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => setShowSearch((v) => !v)} hitSlop={8}>
            <Feather name="search" size={20} color={showSearch ? '#0f9d58' : '#7c918b'} />
          </Pressable>
          <Pressable onPress={() => router.push('/transaction-filters')} hitSlop={8}>
            <View>
              <Feather name="filter" size={20} color={filtersActive ? '#0f9d58' : '#7c918b'} />
              {filtersActive ? (
                <View className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand-600" />
              ) : null}
            </View>
          </Pressable>
        </View>
      }
    >
      <View className="gap-4">
        {/* Resumo do mês */}
        <Card className="flex-row justify-between">
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <Feather name="lock" size={14} color="#7c918b" />
              <Text variant="muted" className="text-xs">
                {t.dashboard.balanceReal}
              </Text>
            </View>
            <Money amount={currentBalance} size="md" className="font-semibold" />
          </View>
          <View className="items-end gap-1">
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={14} color="#7c918b" />
              <Text variant="muted" className="text-xs">
                {t.transactions.monthNet}
              </Text>
            </View>
            <Money amount={monthlyBalance} size="md" className="font-semibold" />
          </View>
        </Card>

        {showSearch ? (
          <View className="h-12 flex-row items-center gap-2 rounded-xl border border-line bg-surface px-3">
            <Feather name="search" size={16} color="#7c918b" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              autoFocus
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
        ) : null}

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
            {isEmptyDueToFilter ? t.transactions.emptyFilter : t.transactions.emptyMonth}
          </Text>
        ) : (
          <View className="gap-4">
            {groups.map((group) => (
              <View key={group.date}>
                <Text variant="muted" className="mb-1 text-xs uppercase tracking-wide">
                  {dayGroupLabel(group.date)}
                </Text>
                <Card className="gap-0 py-0">
                  {group.rows.map((tx) => {
                    const categoryName = tx.category_id
                      ? categoryMap.get(tx.category_id)
                      : undefined;
                    const pending = tx.status === 'pending';
                    return (
                      <ListRow
                        key={`${tx.context_id}-${tx.id}`}
                        onPress={() => setSelected(tx)}
                        leading={<TransactionLeadingIcon tx={tx} categoryName={categoryName} />}
                      >
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
