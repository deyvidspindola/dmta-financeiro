import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi, transfersApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Button,
  DateField,
  MoneyField,
  Screen,
  SelectField,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';

type FormState = {
  fromAccountId: string | null;
  toContextId: string;
  toAccountId: string | null;
  amount: number;
  description: string;
  occurredAt: string;
};

export default function TransferScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const contexts = useAuthStore((s) => s.contexts);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [form, setForm] = useState<FormState>({
    fromAccountId: null,
    toContextId: activeScope,
    toAccountId: null,
    amount: 0,
    description: '',
    occurredAt: new Date().toISOString().slice(0, 10),
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fromAccountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () => accountsApi.listAccounts(activeScope),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const toAccountsQuery = useQuery({
    queryKey: ['accounts', form.toContextId],
    queryFn: () => accountsApi.listAccounts(form.toContextId),
    enabled: !isConsolidated && Boolean(form.toContextId),
  });

  const contextOptions = useMemo(
    () => contexts.map((c) => ({ value: c.id, label: c.name })),
    [contexts],
  );
  const fromAccountOptions = useMemo(
    () => (fromAccountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [fromAccountsQuery.data],
  );
  const toAccountOptions = useMemo(
    () => (toAccountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [toAccountsQuery.data],
  );

  const transfer = useMutation({
    mutationFn: () =>
      transfersApi.createTransfer(activeScope, {
        from_account_id: form.fromAccountId!,
        to_account_id: form.toAccountId!,
        to_context_id: form.toContextId,
        amount: form.amount,
        description: form.description.trim(),
        occurred_at: form.occurredAt,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const sameAccount =
    form.fromAccountId !== null &&
    form.fromAccountId === form.toAccountId &&
    form.toContextId === activeScope;

  const canSubmit =
    !sameAccount &&
    form.fromAccountId !== null &&
    form.toAccountId !== null &&
    form.amount > 0 &&
    form.description.trim().length > 0 &&
    Boolean(form.occurredAt);

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.transfers.create}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {isConsolidated ? (
        <Text variant="muted">{t.debts.needContext}</Text>
      ) : (
        <View className="gap-4">
          <SelectField
            label={t.transfers.from}
            placeholder={t.newTransaction.accountPlaceholder}
            value={form.fromAccountId}
            options={fromAccountOptions}
            onChange={(v) => setForm({ ...form, fromAccountId: v })}
          />
          <SelectField
            label={t.transfers.toContext}
            placeholder={t.common.select}
            value={form.toContextId}
            options={contextOptions}
            onChange={(v) => setForm({ ...form, toContextId: v, toAccountId: null })}
          />
          <SelectField
            label={t.transfers.to}
            placeholder={t.newTransaction.accountPlaceholder}
            value={form.toAccountId}
            options={toAccountOptions}
            onChange={(v) => setForm({ ...form, toAccountId: v })}
          />
          <MoneyField
            label={t.transactions.amount}
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
          />
          <TextField
            label={t.transactions.description}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />
          <DateField
            label={t.transactions.date}
            value={form.occurredAt}
            onChange={(v) => setForm({ ...form, occurredAt: v })}
          />

          {sameAccount ? <Text variant="error">{t.transfers.sameAccount}</Text> : null}
          {formError ? <Text variant="error">{formError}</Text> : null}

          <Button
            label={t.transfers.create}
            loading={transfer.isPending}
            disabled={!canSubmit}
            onPress={() => {
              setFormError(null);
              transfer.mutate();
            }}
          />
        </View>
      )}
    </Screen>
  );
}
