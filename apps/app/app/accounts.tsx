import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accountsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  AccountIcon,
  Button,
  ConfirmSheet,
  Money,
  Screen,
  SelectField,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { MonthNavigator } from '@/components/MonthNavigator';
import { t } from '@/i18n';
import { currentMonthKey } from '@/lib/dates';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import type { Account, AccountType } from '@/types/models';

const TYPE_OPTIONS = (['checking', 'savings', 'wallet', 'other'] as AccountType[]).map((v) => ({
  value: v,
  label: t.accounts.types[v],
}));

type FormState = {
  id: string | null;
  name: string;
  bank: string;
  type: AccountType;
  balance: number;
};
const EMPTY: FormState = { id: null, name: '', bank: '', type: 'checking', balance: 0 };

export default function AccountsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const insets = useSafeAreaInsets();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;
  const month = useMonthStore((s) => s.month);
  const isHistorical = month < currentMonthKey();

  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Account | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope, month],
    queryFn: () => accountsApi.listAccounts(activeScope, month),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const accounts = accountsQuery.data?.accounts ?? [];
  const totals = accountsQuery.data?.totals;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const base = { name: f.name.trim(), bank_name: f.bank.trim() || null, type: f.type };
      return f.id
        ? accountsApi.updateAccount(activeScope, f.id, base)
        : accountsApi.createAccount(activeScope, { ...base, balance: f.balance });
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const remove = useMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(activeScope, id),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
    },
    onError: () => setToDelete(null),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      {/* Cabeçalho */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} className="text-fg" />
          </Pressable>
          <Text variant="title">{t.accounts.title}</Text>
        </View>
        <View className="flex-row items-center gap-4">
          {/* Ícones sem função real — visual + no-op */}
          <Pressable hitSlop={8} onPress={() => {}}>
            {/* Inbox: sem tela de notificações de contas ainda */}
            <Feather name="inbox" size={20} className="text-fg-muted" />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => {}}>
            {/* Reordenar: sem reordenação manual de contas ainda */}
            <Feather name="refresh-cw" size={20} className="text-fg-muted" />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => {}}>
            {/* Menu: sem menu adicional de opções ainda */}
            <Feather name="more-vertical" size={20} className="text-fg-muted" />
          </Pressable>
        </View>
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
        <View className="gap-4">
          {/* Card de resumo com duas colunas */}
          <View className="flex-row gap-3 rounded-2xl border border-line bg-surface p-4">
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Feather name="dollar-sign" size={16} className="text-fg-muted" />
                <Text variant="muted" className="text-xs">
                  {t.accounts.currentBalance}
                </Text>
              </View>
              <Money amount={totals?.current_balance ?? 0} size="lg" />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Feather name="credit-card" size={16} className="text-fg-muted" />
                <Text variant="muted" className="text-xs">
                  {t.accounts.projectedBalance}
                </Text>
              </View>
              <Money amount={totals?.projected_balance ?? 0} size="lg" />
            </View>
          </View>

          {/* Lista de contas */}
          {accounts.length === 0 ? (
            <Text variant="muted">{t.accounts.empty}</Text>
          ) : (
            <View className="rounded-2xl border border-line bg-surface">
              {accounts.map((account, index) => (
                <View key={account.id}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/account',
                        params: { id: account.id, contextId: activeScope },
                      })
                    }
                    className="flex-row items-center justify-between p-4 active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <AccountIcon type={account.type} size="sm" />
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-semibold" numberOfLines={1}>
                          {account.name}
                        </Text>
                        <View className="flex-row gap-4">
                          <View className="gap-0.5">
                            <Text variant="muted" className="text-xs">
                              {t.accounts.currentBalance}
                            </Text>
                            <Money amount={account.balance} size="sm" />
                          </View>
                          <View className="gap-0.5">
                            <Text variant="muted" className="text-xs">
                              {t.accounts.projectedBalance}
                            </Text>
                            <Money amount={account.balance} size="sm" className="text-fg-muted" />
                            {/* Nota: saldo previsto por conta não está calculado — seria account.balance + pending entries daquela conta */}
                          </View>
                        </View>
                      </View>
                    </View>
                    {isHistorical ? null : (
                      <Pressable
                        onPress={() =>
                          setForm({
                            id: account.id,
                            name: account.name,
                            bank: account.bank_name ?? '',
                            type: account.type,
                            balance: account.balance,
                          })
                        }
                        hitSlop={8}
                        className="p-1 active:opacity-60"
                      >
                        <Feather name="more-vertical" size={20} color="#7c918b" />
                      </Pressable>
                    )}
                  </Pressable>
                  {index < accounts.length - 1 ? (
                    <View className="ml-16 h-px bg-line" />
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* FAB circular flutuante */}
      {isConsolidated || isHistorical ? null : (
        <View
          className="absolute right-4 items-center justify-center"
          style={{ bottom: 16 + insets.bottom }}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityLabel={t.accounts.create}
            onPress={() => setForm({ ...EMPTY })}
            className="size-14 items-center justify-center rounded-full bg-brand-600 shadow-lg active:bg-brand-700"
            style={{ elevation: 8 }}
          >
            <Feather name="plus" size={26} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Form (criar / editar) */}
      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.id ? t.accounts.edit : t.accounts.create}
      >
        {form ? (
          <View className="gap-4">
            <TextField
              label={t.accounts.name}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <TextField
              label={t.accounts.bankName}
              value={form.bank}
              onChangeText={(v) => setForm({ ...form, bank: v })}
            />
            <SelectField
              label={t.accounts.type}
              placeholder={t.common.select}
              value={form.type}
              options={TYPE_OPTIONS}
              onChange={(v) => setForm({ ...form, type: v as AccountType })}
            />
            {form.id ? (
              <Text variant="muted" className="text-xs">
                {t.accounts.balanceEditHint}
              </Text>
            ) : null}

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row justify-between gap-2">
              {form.id ? (
                <Button
                  label={t.common.delete}
                  variant="ghost"
                  onPress={() => {
                    const acc = accounts.find((a) => a.id === form.id) ?? null;
                    setForm(null);
                    setToDelete(acc);
                  }}
                />
              ) : (
                <View />
              )}
              <Button
                label={t.accounts.save}
                loading={save.isPending}
                disabled={!form.name.trim()}
                onPress={() => {
                  setFormError(null);
                  save.mutate(form);
                }}
              />
            </View>
          </View>
        ) : null}
      </Sheet>

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
