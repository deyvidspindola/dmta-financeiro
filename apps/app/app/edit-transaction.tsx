import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { accountsApi, categoriesApi, transactionsApi } from '@/api';
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
import { cn } from '@/lib/cn';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';

type EntryType = 'income' | 'expense';

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1),
  account_id: z.string().min(1),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export default function EditTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;

  // Params: contextId, transactionId
  const params = useLocalSearchParams<{ contextId: string; transactionId: string }>();
  const contextId = params.contextId ?? activeScope;
  const transactionId = params.transactionId;

  const [type, setType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const transactionQuery = useQuery({
    queryKey: ['transaction', contextId, transactionId],
    queryFn: () => transactionsApi.getTransaction(contextId, transactionId!),
    enabled: Boolean(contextId) && Boolean(transactionId),
  });

  // Carrega os dados da transação uma vez
  if (!loaded && transactionQuery.data) {
    const tx = transactionQuery.data;
    setType(tx.type === 'income' ? 'income' : 'expense');
    setAmount(Math.abs(tx.amount));
    setDescription(tx.description);
    setAccountId(tx.account_id);
    setCategoryId(tx.category_id);
    setOccurredAt(tx.date);
    setLoaded(true);
  }

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: !isConsolidated && Boolean(contextId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, type],
    queryFn: () => categoriesApi.listCategories(contextId, { type }),
    enabled: !isConsolidated && Boolean(contextId),
  });

  const accountOptions = useMemo(
    () => (accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [accountsQuery.data],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.newTransaction.categoryNone },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

  const mutation = useMutation({
    mutationFn: () =>
      transactionsApi.updateTransaction(contextId, transactionId!, {
        account_id: accountId!,
        category_id: categoryId || null,
        description: description.trim(),
        amount,
        type,
        occurred_at: occurredAt,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['budgets'] });
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

  if (!contextId || !transactionId || isConsolidated) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Text variant="muted">{t.newTransaction.needContext}</Text>
      </Screen>
    );
  }

  function submit() {
    setFormError(null);
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
        <Text variant="title">{t.editTransaction.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {transactionQuery.isLoading ? (
        <Text variant="muted">{t.common.loading}</Text>
      ) : (
        <View className="gap-4">
          {/* Tipo */}
          <View className="flex-row rounded-xl border border-line bg-surface p-1">
            {(['expense', 'income'] as EntryType[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setType(option);
                  setCategoryId(null);
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
                  {option === 'income' ? t.newTransaction.typeIncome : t.newTransaction.typeExpense}
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
            label={t.newTransaction.account}
            placeholder={t.newTransaction.accountPlaceholder}
            value={accountId}
            options={accountOptions}
            onChange={setAccountId}
            error={errors.account_id}
          />
          <SelectField
            label={t.newTransaction.category}
            placeholder={t.newTransaction.categoryPlaceholder}
            value={categoryId ?? ''}
            options={categoryOptions}
            onChange={(v) => setCategoryId(v || null)}
            searchable
          />
          <DateField
            label={t.newTransaction.date}
            value={occurredAt}
            onChange={setOccurredAt}
            error={errors.occurred_at}
          />

          {formError ? <Text variant="error">{formError}</Text> : null}

          <Button
            label={t.editTransaction.submit}
            loading={mutation.isPending}
            onPress={submit}
            className="mt-2"
          />
        </View>
      )}
    </Screen>
  );
}
