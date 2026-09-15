import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsApi, categoriesApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Button,
  ConfirmSheet,
  MoneyField,
  ProgressBar,
  Screen,
  SelectField,
  Sheet,
  Skeleton,
  Text,
} from '@/components/ui';
import { BudgetDetailSheet } from '@/components/budgets/BudgetDetailSheet';
import { t } from '@/i18n';
import { formatMonthLabel } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import type { BudgetRow } from '@/types/models';

type FormState = { budgetId: string | null; categoryId: string | null; limit: number };

export default function BudgetsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const month = useMonthStore((s) => s.month);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<BudgetRow | null>(null);
  const [viewingDetail, setViewingDetail] = useState<BudgetRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const budgetsQuery = useQuery({
    queryKey: ['budgets', activeScope, month],
    queryFn: () => budgetsApi.listBudgets(activeScope, month),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', activeScope, 'expense'],
    queryFn: () => categoriesApi.listCategories(activeScope, { type: 'expense' }),
    enabled: form !== null && !form.budgetId && Boolean(activeScope),
  });

  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesQuery.data],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['budgets'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const save = useMutation({
    mutationFn: (f: FormState) =>
      f.budgetId
        ? budgetsApi.updateBudget(activeScope, f.budgetId, f.limit)
        : budgetsApi.createBudget(activeScope, {
            category_id: f.categoryId!,
            limit_amount: f.limit,
            month,
          }),
    onSuccess: () => {
      invalidate();
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const remove = useMutation({
    mutationFn: (budgetId: string) => budgetsApi.deleteBudget(activeScope, budgetId),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
    },
    onError: () => setToDelete(null),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="title">{t.budgets.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>
      <Text variant="muted" className="mb-4 text-xs">
        {formatMonthLabel(month)}
      </Text>

      {isConsolidated ? (
        <Text variant="muted">{t.budgets.pickContext}</Text>
      ) : budgetsQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : budgetsQuery.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (
        <View className="gap-4">
          {(budgetsQuery.data ?? []).length === 0 ? (
            <Text variant="muted">{t.budgets.empty}</Text>
          ) : (
            <View className="gap-3">
              {(budgetsQuery.data ?? []).map((row) => (
                <Pressable
                  key={row.budget_id}
                  onPress={() => setViewingDetail(row)}
                  className="gap-2 rounded-2xl border border-line bg-surface p-4 active:bg-surface-2"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="font-medium" numberOfLines={1}>
                      {row.category_name}
                    </Text>
                    <Text variant="muted" className="text-xs tabular-nums">
                      {formatMoney(row.spent)} {t.budgets.of} {formatMoney(row.limit)}
                    </Text>
                  </View>
                  <ProgressBar
                    value={row.percent}
                    tone={row.over ? 'negative' : row.percent > 80 ? 'warning' : 'brand'}
                  />
                  <Text variant="muted" className="text-xs">
                    {row.over
                      ? `${t.budgets.over} ${formatMoney(Math.abs(row.remaining))}`
                      : `${t.budgets.remaining}: ${formatMoney(row.remaining)}`}
                    {row.spent_effective !== row.spent
                      ? ` · ${t.budgets.spentEffective(formatMoney(row.spent_effective))}`
                      : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Button
            label={t.budgets.newBudget}
            onPress={() => setForm({ budgetId: null, categoryId: null, limit: 0 })}
          />
        </View>
      )}

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.budgetId ? t.budgets.editBudget : t.budgets.newBudget}
      >
        {form ? (
          <View className="gap-4">
            {!form.budgetId ? (
              <SelectField
                label={t.budgets.category}
                placeholder={t.common.select}
                value={form.categoryId}
                options={categoryOptions}
                onChange={(v) => setForm({ ...form, categoryId: v })}
                searchable
              />
            ) : null}
            <MoneyField
              label={t.budgets.limit}
              value={form.limit}
              onChange={(v) => setForm({ ...form, limit: v })}
            />

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row justify-between gap-2">
              {form.budgetId ? (
                <Button
                  label={t.common.delete}
                  variant="ghost"
                  onPress={() => {
                    const row = budgetsQuery.data?.find((b) => b.budget_id === form.budgetId) ?? null;
                    setForm(null);
                    setToDelete(row);
                  }}
                />
              ) : (
                <View />
              )}
              <Button
                label={t.budgets.save}
                loading={save.isPending}
                disabled={form.limit <= 0 || (!form.budgetId && !form.categoryId)}
                onPress={() => {
                  setFormError(null);
                  save.mutate(form);
                }}
              />
            </View>
          </View>
        ) : null}
      </Sheet>

      <BudgetDetailSheet
        budget={viewingDetail}
        contextId={activeScope}
        month={month}
        onClose={() => setViewingDetail(null)}
        onEdit={() => {
          if (viewingDetail) {
            setForm({
              budgetId: viewingDetail.budget_id,
              categoryId: viewingDetail.category_id,
              limit: viewingDetail.limit,
            });
          }
        }}
      />

      <ConfirmSheet
        open={toDelete !== null}
        title={t.common.delete}
        message={t.budgets.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.budget_id)}
        onClose={() => setToDelete(null)}
      />
    </Screen>
  );
}
