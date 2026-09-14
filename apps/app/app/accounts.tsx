import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Button,
  ConfirmSheet,
  ListRow,
  Money,
  MoneyField,
  Screen,
  SelectField,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
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
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Account | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () => accountsApi.listAccounts(activeScope),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const total = useMemo(
    () => (accountsQuery.data ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accountsQuery.data],
  );

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
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.accounts.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

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
          <View className="flex-row items-center justify-between rounded-2xl border border-line bg-surface p-4">
            <Text variant="muted">{t.accounts.total}</Text>
            <Money amount={total} size="lg" />
          </View>

          {(accountsQuery.data ?? []).length === 0 ? (
            <Text variant="muted">{t.accounts.empty}</Text>
          ) : (
            <View className="rounded-2xl border border-line bg-surface">
              {(accountsQuery.data ?? []).map((account) => (
                <ListRow
                  key={account.id}
                  onPress={() =>
                    router.push({
                      pathname: '/account',
                      params: { id: account.id, contextId: activeScope },
                    })
                  }
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text className="font-medium" numberOfLines={1}>
                        {account.name}
                      </Text>
                      <Text variant="muted" className="text-xs" numberOfLines={1}>
                        {account.bank_name ?? t.accounts.types[account.type]}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Money amount={account.balance} size="sm" />
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
                        <Feather name="edit-2" size={15} color="#7c918b" />
                      </Pressable>
                    </View>
                  </View>
                </ListRow>
              ))}
            </View>
          )}

          <Button label={t.accounts.create} onPress={() => setForm({ ...EMPTY })} />
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
            ) : (
              <MoneyField
                label={t.accounts.balance}
                value={form.balance}
                onChange={(v) => setForm({ ...form, balance: v })}
              />
            )}

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row justify-between gap-2">
              {form.id ? (
                <Button
                  label={t.common.delete}
                  variant="ghost"
                  onPress={() => {
                    const acc = accountsQuery.data?.find((a) => a.id === form.id) ?? null;
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
