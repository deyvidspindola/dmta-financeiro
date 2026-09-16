import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, categoriesApi } from '@/api';
import { DateField, Screen, SelectField, SwitchField, Text } from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import {
  type TransactionStatusFilter,
  useTransactionFilterStore,
} from '@/store/transactionFilterStore';

const STATUS_OPTIONS: TransactionStatusFilter[] = ['all', 'settled', 'pending'];

/**
 * Tela cheia de filtro de Transações (referência visual: Mobills). Estado
 * local até confirmar (FAB ✓) — cancelar/voltar sem confirmar não mexe no
 * `transactionFilterStore` que a lista lê. Não tem "Tags" nem "Salvar
 * filtro" da referência: não existe conceito de tag no domínio, e filtro
 * salvo é uma feature própria que ninguém pediu ainda — não inventa.
 */
export default function TransactionFiltersScreen() {
  const router = useRouter();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;

  const stored = useTransactionFilterStore();
  const [status, setStatus] = useState(stored.status);
  const [accountId, setAccountId] = useState(stored.accountId);
  const [categoryId, setCategoryId] = useState(stored.categoryId);
  const [useCustomPeriod, setUseCustomPeriod] = useState(stored.useCustomPeriod);
  const [periodFrom, setPeriodFrom] = useState(stored.periodFrom ?? '');
  const [periodTo, setPeriodTo] = useState(stored.periodTo ?? '');

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () => accountsApi.listAccounts(activeScope),
    enabled: !isConsolidated,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories', activeScope],
    queryFn: () => categoriesApi.listCategories(activeScope),
    enabled: !isConsolidated,
  });

  const accountOptions = useMemo(
    () => [
      { value: '', label: t.transactions.filters.allAccounts },
      ...(accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    ],
    [accountsQuery.data],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.transactions.filters.allCategories },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  const confirm = () => {
    useTransactionFilterStore.getState().setStatus(status);
    useTransactionFilterStore.getState().setAccountId(accountId);
    useTransactionFilterStore.getState().setCategoryId(categoryId);
    useTransactionFilterStore
      .getState()
      .setPeriod(useCustomPeriod, periodFrom || null, periodTo || null);
    router.back();
  };

  return (
    <Screen
      scroll
      fab={
        <Pressable
          accessibilityLabel={t.common.done}
          onPress={confirm}
          className="size-14 items-center justify-center rounded-full bg-brand-600 shadow-lg active:bg-brand-700"
        >
          <Feather name="check" size={24} color="#fff" />
        </Pressable>
      }
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.transactionFilters.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      <View className="gap-5">
        <View className="gap-2">
          <Text variant="label">{t.transactionFilters.status}</Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setStatus(option)}
                className={cn(
                  'rounded-full border px-4 py-2',
                  status === option ? 'border-brand-600 bg-brand-600' : 'border-line bg-surface',
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    status === option ? 'text-white' : 'text-fg-muted',
                  )}
                >
                  {option === 'all'
                    ? t.transactions.filters.all
                    : option === 'settled'
                      ? t.transactions.filters.settled
                      : t.transactions.filters.pending}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isConsolidated ? null : (
          <>
            <View className="flex-row items-end gap-3">
              <Feather name="bookmark" size={18} color="#7c918b" style={{ marginBottom: 14 }} />
              <View className="min-w-0 flex-1">
                <SelectField
                  label={t.transactionFilters.categories}
                  placeholder={t.transactions.filters.allCategories}
                  value={categoryId ?? ''}
                  options={categoryOptions}
                  onChange={(v) => setCategoryId(v || null)}
                />
              </View>
            </View>

            <View className="flex-row items-end gap-3">
              <Feather name="credit-card" size={18} color="#7c918b" style={{ marginBottom: 14 }} />
              <View className="min-w-0 flex-1">
                <SelectField
                  label={t.transactionFilters.accounts}
                  placeholder={t.transactions.filters.allAccounts}
                  value={accountId ?? ''}
                  options={accountOptions}
                  onChange={(v) => setAccountId(v || null)}
                />
              </View>
            </View>
          </>
        )}

        <View className="gap-3 border-t border-line pt-4">
          <SwitchField
            label={t.transactionFilters.period}
            value={useCustomPeriod}
            onChange={setUseCustomPeriod}
          />
          {useCustomPeriod ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DateField
                  label={t.transactionFilters.periodFrom}
                  value={periodFrom}
                  onChange={setPeriodFrom}
                />
              </View>
              <View className="flex-1">
                <DateField
                  label={t.transactionFilters.periodTo}
                  value={periodTo}
                  onChange={setPeriodTo}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
