import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi, ApiError, categoriesApi, transactionsApi } from '@/api';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import {
  Badge,
  Button,
  Card,
  ListRow,
  Money,
  MoneyField,
  MoneyValue,
  Screen,
  Sheet,
  Skeleton,
  Text,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { currentMonthKey, formatDateShort, formatMonthLabel, monthDateRange } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { transactionBalanceEffect, transactionDirection } from '@/lib/transactionDisplay';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { useMonthStore } from '@/store/monthStore';
import { toastSuccess } from '@/store/toastStore';
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
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const { id, contextId } = useLocalSearchParams<{ id: string; contextId: string }>();
  const month = useMonthStore((s) => s.month);
  const [selected, setSelected] = useState<StatementEntry | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBalance, setAdjustBalance] = useState(0);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);

  const isHistorical = month < currentMonthKey();

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId, month],
    queryFn: () => accountsApi.listAccounts(contextId, month),
    enabled: Boolean(contextId),
  });
  const account = accountsQuery.data?.find((a) => a.id === id) ?? null;

  const adjust = useMutation({
    mutationFn: async (target: number) => {
      if (!account || !contextId) return;
      const diff = Math.round((target - account.balance) * 100) / 100;
      if (diff === 0) throw new Error(t.accountDetail.adjustBalanceSame);
      return transactionsApi.createTransaction(contextId, {
        account_id: account.id,
        category_id: null,
        description: t.accountDetail.adjustBalanceDescription,
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        occurred_at: new Date().toISOString().slice(0, 10),
        settled: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAdjustOpen(false);
      toastSuccess(t.accountDetail.adjustBalanceSuccess);
    },
    onError: (err) =>
      setAdjustError(err instanceof ApiError && err.message ? err.message : (err as Error).message),
  });

  const toggleIncludeInDashboard = useMutation({
    mutationFn: async () => {
      if (!account || !contextId) return;
      return accountsApi.updateAccount(contextId, account.id, {
        name: account.name,
        bank_name: account.bank_name,
        type: account.type,
        include_in_dashboard: !account.include_in_dashboard,
        color: account.color,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

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

  // Contagens do mês exibido — não é histórico "desde sempre", é o mesmo
  // recorte de mês que já move o extrato abaixo.
  const counts = useMemo(() => {
    const rows = transactionsQuery.data ?? [];
    return {
      income: rows.filter((r) => r.type === 'income').length,
      expense: rows.filter((r) => r.type === 'expense').length,
      transfer: rows.filter((r) => r.type === 'transfer').length,
    };
  }, [transactionsQuery.data]);

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        {/* Dropdown para trocar de conta */}
        <Pressable
          onPress={() => setAccountSwitcherOpen(true)}
          className="flex-row items-center gap-2 active:opacity-70"
        >
          <Text variant="title" numberOfLines={1}>
            {account?.name ?? t.accountDetail.title}
          </Text>
          <Feather name="chevron-down" size={20} color="#7c918b" />
        </Pressable>
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
            {isHistorical ? null : (
              <Pressable
                onPress={() => {
                  setAdjustBalance(account.balance);
                  setAdjustError(null);
                  setAdjustOpen(true);
                }}
                className="mt-3 self-start rounded-full bg-negative px-4 py-2 active:opacity-80"
              >
                <Text className="text-xs font-semibold uppercase tracking-wide text-white">
                  {t.accountDetail.adjustBalance}
                </Text>
              </Pressable>
            )}
          </Card>

          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {t.accountDetail.institution}
              </Text>
              <Text className="text-sm font-medium" numberOfLines={1}>
                {account.bank_name ?? '—'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {t.accountDetail.initialBalance}
              </Text>
              <Money amount={account.initial_balance} size="sm" />
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {t.accountDetail.incomeCount}
              </Text>
              <Text className="text-sm font-medium">{counts.income}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {t.accountDetail.expenseCount}
              </Text>
              <Text className="text-sm font-medium">{counts.expense}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {t.accountDetail.transferCount}
              </Text>
              <Text className="text-sm font-medium">{counts.transfer}</Text>
            </View>

            {/* Toggle "Incluir na tela inicial" */}
            {!isHistorical && (
              <>
                <View className="border-t border-line my-1" />
                <Pressable
                  onPress={() => toggleIncludeInDashboard.mutate()}
                  disabled={toggleIncludeInDashboard.isPending}
                  className="flex-row items-center justify-between active:opacity-70"
                >
                  <View className="flex-row items-center gap-2">
                    <Feather name="home" size={16} color="#7c918b" />
                    <Text variant="muted" className="text-xs">
                      {t.accounts.includeInDashboard}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-6 w-11 rounded-full p-0.5 transition-colors',
                      account.include_in_dashboard ? 'bg-primary' : 'bg-fg-muted',
                    )}
                  >
                    <View
                      className={cn(
                        'h-5 w-5 rounded-full bg-white transition-transform',
                        account.include_in_dashboard && 'translate-x-5',
                      )}
                    />
                  </View>
                </Pressable>
              </>
            )}
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

      {/* FAB para editar */}
      {!isHistorical && account && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/account-edit',
              params: { id: account.id, contextId: contextId ?? '' },
            })
          }
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-negative shadow-lg active:opacity-80"
        >
          <Feather name="edit-2" size={20} color="#ffffff" />
        </Pressable>
      )}

      <TransactionDetailSheet
        entry={selected}
        contextId={contextId ?? null}
        accountName={account?.name}
        categoryName={selected?.category_id ? categoryMap.get(selected.category_id) : undefined}
        onClose={() => setSelected(null)}
      />

      {/* Sheet para trocar de conta */}
      <Sheet
        open={accountSwitcherOpen}
        onClose={() => setAccountSwitcherOpen(false)}
        title={t.accounts.title}
      >
        <View className="gap-2">
          {(accountsQuery.data ?? []).map((acc) => (
            <Pressable
              key={acc.id}
              onPress={() => {
                setAccountSwitcherOpen(false);
                router.replace({
                  pathname: '/account',
                  params: { id: acc.id, contextId: contextId ?? '' },
                });
              }}
              className={cn(
                'rounded-lg p-3 active:opacity-70',
                acc.id === id && 'bg-surface-hover',
              )}
            >
              <Text className={cn('font-medium', acc.id === id && 'text-primary')}>{acc.name}</Text>
              <Text variant="muted" className="text-xs">
                {acc.bank_name ?? t.accounts.types[acc.type]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={t.accountDetail.adjustBalance}
      >
        <View className="gap-4">
          <Text variant="muted">{t.accountDetail.adjustBalanceHint}</Text>
          <MoneyField
            label={t.accountDetail.adjustBalanceNewBalance}
            value={adjustBalance}
            onChange={setAdjustBalance}
          />
          {adjustError ? <Text variant="error">{adjustError}</Text> : null}
          <Button
            label={t.accountDetail.adjustBalanceSubmit}
            loading={adjust.isPending}
            onPress={() => {
              setAdjustError(null);
              adjust.mutate(adjustBalance);
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}
