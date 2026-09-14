import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { accountsApi, categoriesApi, transactionsApi, transfersApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Button,
  DateField,
  MoneyField,
  Screen,
  SelectField,
  SwitchField,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';

type EntryType = 'income' | 'expense' | 'transfer';

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1),
  account_id: z.string().min(1),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const transferSchema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1),
  from_account_id: z.string().min(1),
  to_account_id: z.string().min(1),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const contexts = useAuthStore((s) => s.contexts);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [type, setType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState(todayIso());
  const [settled, setSettled] = useState(true);
  const [toContextId, setToContextId] = useState(activeScope);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isTransfer = type === 'transfer';

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () => accountsApi.listAccounts(activeScope),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const toAccountsQuery = useQuery({
    queryKey: ['accounts', toContextId],
    queryFn: () => accountsApi.listAccounts(toContextId),
    enabled: !isConsolidated && isTransfer && Boolean(toContextId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', activeScope, type],
    queryFn: () =>
      categoriesApi.listCategories(activeScope, { type: type as 'income' | 'expense' }),
    enabled: !isConsolidated && !isTransfer && Boolean(activeScope),
  });

  const accountOptions = useMemo(
    () => (accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [accountsQuery.data],
  );
  const toAccountOptions = useMemo(
    () => (toAccountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [toAccountsQuery.data],
  );
  const contextOptions = useMemo(
    () => contexts.map((c) => ({ value: c.id, label: c.name })),
    [contexts],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.newTransaction.categoryNone },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

  const sameAccount =
    isTransfer && accountId !== null && accountId === toAccountId && toContextId === activeScope;

  const mutation = useMutation({
    mutationFn: async () => {
      if (isTransfer) {
        await transfersApi.createTransfer(activeScope, {
          from_account_id: accountId!,
          to_account_id: toAccountId!,
          to_context_id: toContextId,
          amount,
          description: description.trim(),
          occurred_at: occurredAt,
        });
        return;
      }
      await transactionsApi.createTransaction(activeScope, {
        account_id: accountId!,
        category_id: categoryId || null,
        description: description.trim(),
        amount,
        type,
        occurred_at: occurredAt,
        settled,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      router.back();
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError && err.status === 422
          ? (err.message ?? t.newTransaction.errors.generic)
          : t.newTransaction.errors.generic,
      );
    },
  });

  if (sessionRoute !== '/(tabs)') {
    return <Redirect href={sessionRoute} />;
  }

  function submit() {
    setFormError(null);

    if (isTransfer) {
      const parsed = transferSchema.safeParse({
        amount,
        description,
        from_account_id: accountId ?? '',
        to_account_id: toAccountId ?? '',
        occurred_at: occurredAt,
      });
      if (!parsed.success || sameAccount) {
        const next: Record<string, string> = {};
        for (const issue of parsed.success ? [] : parsed.error.issues) {
          const key = String(issue.path[0]);
          next[key] =
            key === 'amount'
              ? t.newTransaction.errors.amount
              : key === 'description'
                ? t.newTransaction.errors.description
                : key === 'occurred_at'
                  ? t.newTransaction.errors.date
                  : t.newTransaction.errors.account;
        }
        setErrors(next);
        if (sameAccount) setFormError(t.transfers.sameAccount);
        return;
      }
      setErrors({});
      mutation.mutate();
      return;
    }

    const parsed = schema.safeParse({
      amount,
      description,
      account_id: accountId ?? '',
      occurred_at: occurredAt,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] =
          key === 'amount'
            ? t.newTransaction.errors.amount
            : key === 'description'
              ? t.newTransaction.errors.description
              : key === 'account_id'
                ? t.newTransaction.errors.account
                : t.newTransaction.errors.date;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate();
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.newTransaction.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {isConsolidated ? (
        <Text variant="muted">{t.newTransaction.needContext}</Text>
      ) : (
        <View className="gap-4">
          {/* Tipo */}
          <View className="flex-row rounded-xl border border-line bg-surface p-1">
            {(['expense', 'income', 'transfer'] as EntryType[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setType(option);
                  setCategoryId(null);
                  setToAccountId(null);
                  setToContextId(activeScope);
                }}
                className={cn(
                  'flex-1 items-center rounded-lg py-2',
                  type === option && 'bg-canvas',
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    type === option ? 'font-semibold text-fg' : 'text-fg-muted',
                  )}
                >
                  {option === 'income'
                    ? t.newTransaction.typeIncome
                    : option === 'expense'
                      ? t.newTransaction.typeExpense
                      : t.transfers.create}
                </Text>
              </Pressable>
            ))}
          </View>

          <MoneyField
            label={t.newTransaction.amount}
            value={amount}
            onChange={setAmount}
            error={errors.amount}
          />
          <TextField
            label={t.newTransaction.description}
            placeholder={t.newTransaction.descriptionPlaceholder}
            value={description}
            onChangeText={setDescription}
            error={errors.description}
          />
          <SelectField
            label={isTransfer ? t.transfers.from : t.newTransaction.account}
            placeholder={t.newTransaction.accountPlaceholder}
            value={accountId}
            options={accountOptions}
            onChange={setAccountId}
            error={errors.account_id}
          />

          {isTransfer ? (
            <>
              <SelectField
                label={t.transfers.toContext}
                placeholder={t.common.select}
                value={toContextId}
                options={contextOptions}
                onChange={(v) => {
                  setToContextId(v);
                  setToAccountId(null);
                }}
              />
              <SelectField
                label={t.transfers.to}
                placeholder={t.newTransaction.accountPlaceholder}
                value={toAccountId}
                options={toAccountOptions}
                onChange={setToAccountId}
              />
              {sameAccount ? <Text variant="error">{t.transfers.sameAccount}</Text> : null}
            </>
          ) : (
            <SelectField
              label={t.newTransaction.category}
              placeholder={t.newTransaction.categoryPlaceholder}
              value={categoryId ?? ''}
              options={categoryOptions}
              onChange={(v) => setCategoryId(v || null)}
              searchable
            />
          )}

          <DateField
            label={t.newTransaction.date}
            value={occurredAt}
            onChange={setOccurredAt}
            error={errors.occurred_at}
          />

          {isTransfer ? null : (
            <SwitchField
              label={t.newTransaction.forecast}
              hint={t.newTransaction.forecastHint}
              value={!settled}
              onChange={(isForecast) => setSettled(!isForecast)}
            />
          )}

          {formError ? <Text variant="error">{formError}</Text> : null}

          <Button
            label={isTransfer ? t.transfers.create : t.newTransaction.submit}
            loading={mutation.isPending}
            disabled={isTransfer && sameAccount}
            onPress={submit}
            className="mt-2"
          />
        </View>
      )}
    </Screen>
  );
}
