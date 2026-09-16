import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/api';
import { ConfirmSheet, ListRow, Money, Screen, Skeleton, Text } from '@/components/ui';
import { MonthNavigator } from '@/components/MonthNavigator';
import { t } from '@/i18n';
import { currentMonthKey } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { accountColor } from '@/lib/accountColor';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import type { Account } from '@/types/models';

export default function AccountsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;
  const month = useMonthStore((s) => s.month);
  const isHistorical = month < currentMonthKey();

  const [toDelete, setToDelete] = useState<Account | null>(null);
  const [menuAccount, setMenuAccount] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope, month],
    queryFn: () => accountsApi.listAccounts(activeScope, month),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const currentTotal = useMemo(
    () => (accountsQuery.data ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accountsQuery.data],
  );
  // Soma dos `projected_balance` de cada conta — a API já resolve pending
  // vs. mês fechado (ver AccountResource::projectedBalance no backend).
  const projectedTotal = useMemo(
    () => (accountsQuery.data ?? []).reduce((sum, a) => sum + a.projected_balance, 0),
    [accountsQuery.data],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(activeScope, id),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      setMenuAccount(null);
    },
    onError: () => setToDelete(null),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen
      scroll
      fab={
        !isConsolidated && !isHistorical ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/account-edit',
                params: { contextId: activeScope },
              })
            }
            className="h-14 w-14 items-center justify-center rounded-full bg-brand-600 shadow-lg active:bg-brand-700"
          >
            <Feather name="plus" size={24} color="#ffffff" />
          </Pressable>
        ) : undefined
      }
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.accounts.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {isConsolidated ? null : (
        <View className="mb-4 items-center">
          <MonthNavigator />
        </View>
      )}

      {isConsolidated ? (
        <Text variant="muted">{t.accounts.needContext}</Text>
      ) : accountsQuery.isLoading ? (
        <View className="gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </View>
      ) : accountsQuery.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (
        <View className="gap-4 pb-20">
          {/* Cabeçalho com saldo atual e previsto lado a lado */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-line bg-surface p-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Feather name="dollar-sign" size={16} color="#7c918b" />
                <Text variant="muted" className="text-xs">
                  {t.accounts.currentBalance}
                </Text>
              </View>
              <Money amount={currentTotal} size="lg" className="font-semibold" />
            </View>
            <View className="flex-1 rounded-2xl border border-line bg-surface p-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Feather name="trending-up" size={16} color="#7c918b" />
                <Text variant="muted" className="text-xs">
                  {t.accounts.projectedBalance}
                </Text>
              </View>
              <Money amount={projectedTotal} size="lg" className="font-semibold" />
            </View>
          </View>

          {(accountsQuery.data ?? []).length === 0 ? (
            <Text variant="muted">{t.accounts.empty}</Text>
          ) : (
            <View className="rounded-2xl border border-line bg-surface">
              {(accountsQuery.data ?? []).map((account) => {
                const color = accountColor(account.color);

                return (
                  <ListRow
                    key={account.id}
                    onPress={() =>
                      router.push({
                        pathname: '/account',
                        params: { id: account.id, contextId: activeScope },
                      })
                    }
                    leading={
                      <View
                        className="h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        <Feather
                          name={
                            account.type === 'checking'
                              ? 'credit-card'
                              : account.type === 'savings'
                                ? 'home'
                                : account.type === 'wallet'
                                  ? 'dollar-sign'
                                  : 'briefcase'
                          }
                          size={24}
                          color="#ffffff"
                        />
                      </View>
                    }
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-medium" numberOfLines={1}>
                          {account.name}
                        </Text>
                        <View className="gap-0.5">
                          <Text variant="muted" className="text-xs">
                            {t.accounts.currentBalance}
                          </Text>
                          <Text variant="muted" className="text-xs">
                            {t.accounts.projectedBalance}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end gap-0.5">
                        <Text variant="muted" className="text-xs">
                          {formatMoney(account.balance)}
                        </Text>
                        <Text variant="muted" className="text-xs">
                          {formatMoney(account.projected_balance)}
                        </Text>
                      </View>
                      {isHistorical ? null : (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setMenuAccount(menuAccount === account.id ? null : account.id);
                          }}
                          hitSlop={8}
                          className="p-1 active:opacity-60"
                        >
                          <Feather name="more-vertical" size={18} color="#7c918b" />
                        </Pressable>
                      )}
                    </View>

                    {/* Menu dropdown expandido abaixo da linha */}
                    {menuAccount === account.id && (
                      <View className="mt-3 gap-2 border-t border-line pt-3">
                        <Pressable
                          onPress={() => {
                            setMenuAccount(null);
                            router.push({
                              pathname: '/account-edit',
                              params: { id: account.id, contextId: activeScope },
                            });
                          }}
                          className="flex-row items-center gap-3 rounded-lg p-2 active:bg-surface-2"
                        >
                          <Feather name="edit-2" size={16} color="#7c918b" />
                          <Text>{t.common.edit}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setMenuAccount(null);
                            setToDelete(account);
                          }}
                          className="flex-row items-center gap-3 rounded-lg p-2 active:bg-surface-2"
                        >
                          <Feather name="trash-2" size={16} color="#ef4444" />
                          <Text className="text-negative">{t.common.delete}</Text>
                        </Pressable>
                      </View>
                    )}
                  </ListRow>
                );
              })}
            </View>
          )}
        </View>
      )}

      <ConfirmSheet
        open={toDelete !== null}
        title={t.accounts.edit}
        message={t.accounts.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </Screen>
  );
}
