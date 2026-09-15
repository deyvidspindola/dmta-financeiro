import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { categoriesApi, creditCardsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  AmountHero,
  Button,
  CategoryIcon,
  DateField,
  Screen,
  SelectField,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { useSessionRoute } from '@/hooks/useSessionRoute';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export default function CardPurchaseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const params = useLocalSearchParams<{
    cardId?: string;
    contextId?: string;
    purchaseId?: string;
    description?: string;
    amount?: string;
    categoryId?: string;
    occurredAt?: string;
  }>();

  const isEdit = Boolean(params.purchaseId);

  const [amount, setAmount] = useState(params.amount ? Number(params.amount) : 0);
  const [description, setDescription] = useState(params.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId || null);
  const [occurredAt, setOccurredAt] = useState(params.occurredAt ?? todayIso());
  const [installments, setInstallments] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories', params.contextId, 'expense'],
    queryFn: () => categoriesApi.listCategories(params.contextId!, { type: 'expense' }),
    enabled: Boolean(params.contextId),
  });

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.creditCards.purchaseCategoryNone },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        description: description.trim(),
        amount,
        occurred_at: occurredAt,
        category_id: categoryId || null,
      };
      return isEdit
        ? creditCardsApi.updateCardPurchase(
            params.contextId!,
            params.cardId!,
            params.purchaseId!,
            base,
          )
        : creditCardsApi.createCardPurchase(params.contextId!, params.cardId!, {
            ...base,
            installments: Math.max(1, Number(installments) || 1),
          });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      void queryClient.invalidateQueries({ queryKey: ['card-invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['card-purchases'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;
  if (!params.cardId || !params.contextId) return <Redirect href="/(tabs)/cards" />;

  function submit() {
    setFormError(null);
    const parsed = schema.safeParse({ amount, description, occurred_at: occurredAt });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] =
          key === 'amount'
            ? t.newTransaction.errors.amount
            : key === 'description'
              ? t.newTransaction.errors.description
              : t.newTransaction.errors.date;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate();
  }

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">
          {isEdit ? t.creditCards.editPurchase : t.creditCards.newPurchase}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      <View className="gap-4">
        <AmountHero
          value={amount}
          onChange={setAmount}
          toneClassName="text-accent-600 dark:text-accent-400"
          error={errors.amount}
        />
        <TextField
          label={t.creditCards.purchaseDescription}
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />
        <SelectField
          label={t.creditCards.purchaseCategory}
          placeholder={t.creditCards.purchaseCategoryNone}
          value={categoryId ?? ''}
          options={categoryOptions}
          onChange={(v) => setCategoryId(v || null)}
          searchable
          renderIcon={(opt) => (
            <CategoryIcon categoryId={opt.value || null} name={opt.label} size="sm" />
          )}
        />
        <DateField
          label={t.creditCards.purchaseDate}
          value={occurredAt}
          onChange={setOccurredAt}
          error={errors.occurred_at}
        />
        {!isEdit ? (
          <TextField
            label={t.creditCards.installments}
            value={installments}
            onChangeText={setInstallments}
            keyboardType="number-pad"
          />
        ) : null}

        {formError ? <Text variant="error">{formError}</Text> : null}

        <Button
          label={t.creditCards.savePurchase}
          loading={mutation.isPending}
          onPress={submit}
          className="mt-2 bg-accent-600 active:bg-accent-700"
        />
      </View>
    </Screen>
  );
}
