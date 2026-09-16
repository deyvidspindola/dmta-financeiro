import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi, ApiError, categoriesApi, transactionsApi } from '@/api';
import { TransactionDetailSheet } from '@/components/transactions/TransactionDetailSheet';
import {
  AccountIcon,
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
  SwitchField,
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

  const isHistorical = month < currentMonthKey();

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId, month],
    queryFn: () => accountsApi.listAccounts(contextId, month),
    enabled: Boolean(contextId),
  });
  const accounts = accountsQuery.data?.accounts ?? [];
  const account = accounts.find((a) => a.id === id) ?? null;

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

  const updateIncludeMutation = useMutation({
    mutationFn: (includeInDashboard: boolean) => {
      if (!account || !contextId) return Promise.resolve(account!);
      return accountsApi.updateAccount(contextId, account.id, {
        name: account.name,
        bank_name: account.bank_name,
        type: account.type,
        include_in_dashboard: includeInDashboard,
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
      {/* Cabeçalho */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} className="text-fg" />
          </Pressable>
          <Text variant="title" numberOfLines={1}>
            {t.accountDetail.title}
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          {/* Ícones sem função real — visual + no-op */}
          <Pressable hitSlop={8} onPress={() => {}}>
            {/* Lista: sem função específica de lista aqui */}
            <Feather name="list" size={20} className="text-fg-muted" />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => {}}>
            {/* Balança/comparação: sem comparação entre contas ainda */}
            <Feather name="bar-chart-2" size={20} className="text-fg-muted" />
          </Pressable>
        </View>
      </View>

      {accountsQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !account ? (
        <Text variant="muted">{t.accountDetail.notFound}</Text>
      ) : (
        <View className="gap-4">
          {/* Seletor de conta (só visual por enquanto) */}
          <Pressable
            onPress={() => {}}
            className="items-center py-2 active:opacity-70"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold" numberOfLines={1}>
                {account.name}
              </Text>
              <Feather name="chevron-down" size={16} className="text-fg-muted" />
              {/* Dropdown de contas: sem implementação real — precisaria de Sheet com lista de contas */}
            </View>
          </Pressable>

          {/* Card do saldo */}
          <Card className="items-center gap-3 py-6">
            <Text variant="muted" className="text-xs uppercase tracking-wide">
              {t.accountDetail.currentBalance}
            </Text>
            <Money amount={account.balance} size="xl" />
            {isHistorical ? null : (
              <Pressable
                onPress={() => {
                  setAdjustBalance(account.balance);
                  setAdjustError(null);
                  setAdjustOpen(true);
                }}
                className="mt-2 rounded-full bg-negative px-6 py-2.5 active:opacity-80"
              >
                <Text className="text-xs font-semibold uppercase tracking-wide text-white">
                  {t.accountDetail.adjustBalance}
                </Text>
              </Pressable>
            )}
          </Card>

          {/* Painel de informações */}
          <Card className="gap-4">
            {/* Instituição bancária */}
            <View className="flex-row items-center gap-3">
              <AccountIcon type={account.type} size="sm" />
              <View className="min-w-0 flex-1 gap-0.5">
                <Text variant="muted" className="text-xs">
                  {t.accountDetail.institution}
                </Text>
                <Text className="font-semibold" numberOfLines={1}>
                  {account.bank_name ?? '—'}
                </Text>
              </View>
            </View>

            {/* Duas colunas: Tipo da conta e Saldo inicial */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Feather name="credit-card" size={14} className="text-fg-muted" />
                  <Text variant="muted" className="text-xs">
                    {t.accountDetail.accountType}
                  </Text>
                </View>
                <Text className="text-sm font-medium">{t.accounts.types[account.type]}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Feather name="dollar-sign" size={14} className="text-fg-muted" />
                  <Text variant="muted" className="text-xs">
                    {t.accountDetail.initialBalance}
                  </Text>
                </View>
                <Money amount={account.initial_balance} size="sm" />
              </View>
            </View>

            {/* Duas colunas: Despesas e Receitas */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Feather name="trending-down" size={14} className="text-negative" />
                  <Text variant="muted" className="text-xs">
                    {t.accountDetail.expenseCount}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-negative">{counts.expense}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Feather name="trending-up" size={14} className="text-positive" />
                  <Text variant="muted" className="text-xs">
                    {t.accountDetail.incomeCount}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-positive">{counts.income}</Text>
              </View>
            </View>

            {/* Uma linha: Transferências */}
            <View className="gap-0.5">
              <View className="flex-row items-center gap-2">
                <Feather name="repeat" size={14} className="text-fg-muted" />
                <Text variant="muted" className="text-xs">
                  {t.accountDetail.transferCount}
                </Text>
              </View>
              <Text className="text-sm font-medium">{counts.transfer}</Text>
            </View>

            {/* Separador */}
            <View className="h-px bg-line" />

            {/* Switch: Incluir na tela inicial */}
            <SwitchField
              label={t.accounts.includeInDashboard}
              hint={t.accounts.includeInDashboardHint}
              value={account.include_in_dashboard}
              onChange={(value) => updateIncludeMutation.mutate(value)}
            />
          </Card>

          {/* Extrato do mês (mantém como está) */}
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
