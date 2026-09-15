import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { categoriesApi, creditCardsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  AmountHero,
  CategoryIcon,
  QuickDateField,
  SelectField,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSessionRoute } from '@/hooks/useSessionRoute';

// Mesma cor do atalho "Despesa no cartão" no leque do FAB — identidade
// visual de "gasto no cartão" separada do vermelho de despesa comum.
const TONE_HEX = '#0891b2';
const TONE_TEXT = 'text-cyan-600 dark:text-cyan-400';
const TONE_SOLID_BG = 'bg-cyan-600';
const CATEGORY_CHIP_COLOR = '#3b82f6';

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
  const insets = useSafeAreaInsets();
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
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4 px-5 pb-6 pt-2">
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Feather name="arrow-left" size={22} color="#e7efec" />
              </Pressable>
              <Text variant="title">
                {isEdit ? t.creditCards.editPurchase : t.creditCards.newPurchase}
              </Text>
            </View>

            <AmountHero
              label={t.creditCards.purchaseAmount}
              value={amount}
              onChange={setAmount}
              toneClassName={TONE_TEXT}
              toneColor={TONE_HEX}
              error={errors.amount}
            />
          </View>

          <View className="grow gap-4 rounded-t-3xl bg-surface-2 px-5 pb-28 pt-6">
            <QuickDateField
              label={t.creditCards.purchaseDate}
              value={occurredAt}
              onChange={setOccurredAt}
              toneClassName={TONE_SOLID_BG}
            />
            {errors.occurred_at ? <Text variant="error">{errors.occurred_at}</Text> : null}

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
              variant="chip"
              chipToneColor={CATEGORY_CHIP_COLOR}
              renderIcon={(opt) => (
                <CategoryIcon categoryId={opt.value || null} name={opt.label} size="sm" />
              )}
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
          </View>
        </ScrollView>

        <View
          className="absolute left-0 right-0 items-center"
          style={{ bottom: 20 + insets.bottom }}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityLabel={t.creditCards.savePurchase}
            onPress={submit}
            disabled={mutation.isPending}
            className={cn(
              'size-16 items-center justify-center rounded-full shadow-lg',
              mutation.isPending && 'opacity-50',
            )}
            style={{ backgroundColor: TONE_HEX, elevation: 8 }}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather name="check" size={28} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
