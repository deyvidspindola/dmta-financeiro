import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { debtsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Badge,
  Button,
  ConfirmSheet,
  ListRow,
  MoneyField,
  MoneyValue,
  Screen,
  SelectField,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort } from '@/lib/dates';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import type { Debt, DebtDirection } from '@/types/models';

type FormState = {
  id: string | null;
  description: string;
  amount: number;
  direction: DebtDirection;
  counterparty: string;
  dueDate: string;
  notes: string;
};

export default function DebtsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Debt | null>(null);
  const [toSettle, setToSettle] = useState<Debt | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['debts', activeScope],
    queryFn: () => debtsApi.listDebts(activeScope),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const groups = useMemo(() => {
    const pending = (query.data ?? []).filter((d) => d.status === 'pending');
    const settled = (query.data ?? []).filter((d) => d.status === 'settled');
    return { pending, settled };
  }, [query.data]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['debts'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const base = {
        description: f.description.trim(),
        amount: f.amount,
        counterparty: f.counterparty.trim() || null,
        due_date: f.dueDate.trim() || null,
        notes: f.notes.trim() || null,
      };
      return f.id
        ? debtsApi.updateDebt(activeScope, f.id, base)
        : debtsApi.createDebt(activeScope, { ...base, direction: f.direction });
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const settle = useMutation({
    mutationFn: (id: string) => debtsApi.settleDebt(activeScope, id),
    onSuccess: () => {
      invalidate();
      setToSettle(null);
    },
    onError: () => setToSettle(null),
  });

  const remove = useMutation({
    mutationFn: (id: string) => debtsApi.deleteDebt(activeScope, id),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
    },
    onError: () => setToDelete(null),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  const renderDebt = (debt: Debt) => (
    <ListRow
      key={debt.id}
      onPress={() =>
        setForm({
          id: debt.id,
          description: debt.description,
          amount: debt.amount,
          direction: debt.direction,
          counterparty: debt.counterparty ?? '',
          dueDate: debt.due_date ?? '',
          notes: debt.notes ?? '',
        })
      }
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-medium" numberOfLines={1}>
            {debt.description}
          </Text>
          <Text variant="muted" className="text-xs" numberOfLines={1}>
            {t.debts.directions[debt.direction]}
            {debt.counterparty ? ` · ${debt.counterparty}` : ''}
            {debt.due_date ? ` · ${formatDateShort(debt.due_date)}` : ''}
          </Text>
        </View>
        <MoneyValue
          amount={debt.amount}
          direction={debt.direction === 'i_owe' ? 'debit' : 'credit'}
          size="sm"
        />
      </View>
    </ListRow>
  );

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.debts.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {isConsolidated ? (
        <Text variant="muted">{t.debts.needContext}</Text>
      ) : query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : query.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (query.data ?? []).length === 0 ? (
        <View className="gap-4">
          <Text variant="muted">{t.debts.empty}</Text>
          <Button label={t.debts.create} onPress={() => openCreate()} />
        </View>
      ) : (
        <View className="gap-4">
          {groups.pending.length > 0 ? (
            <View className="rounded-2xl border border-line bg-surface">
              {groups.pending.map(renderDebt)}
            </View>
          ) : null}

          {groups.settled.length > 0 ? (
            <View className="gap-1">
              <Text variant="muted" className="text-xs uppercase tracking-wide">
                {t.debts.statuses.settled}
              </Text>
              <View className="rounded-2xl border border-line bg-surface opacity-60">
                {groups.settled.map(renderDebt)}
              </View>
            </View>
          ) : null}

          <Button label={t.debts.create} onPress={() => openCreate()} />
        </View>
      )}

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.id ? t.debts.edit : t.debts.create}
      >
        {form ? (
          <View className="gap-4">
            {form.id ? (
              <Badge tone="neutral">{t.debts.directions[form.direction]}</Badge>
            ) : (
              <SelectField
                label={t.debts.direction}
                placeholder={t.common.select}
                value={form.direction}
                options={(['i_owe', 'owed_to_me'] as DebtDirection[]).map((v) => ({
                  value: v,
                  label: t.debts.directions[v],
                }))}
                onChange={(v) => setForm({ ...form, direction: v as DebtDirection })}
              />
            )}
            <TextField
              label={t.debts.description}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
            <MoneyField
              label={t.debts.amount}
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
            />
            <TextField
              label={t.debts.counterparty}
              value={form.counterparty}
              onChangeText={(v) => setForm({ ...form, counterparty: v })}
            />
            <TextField
              label={t.debts.dueDate}
              value={form.dueDate}
              onChangeText={(v) => setForm({ ...form, dueDate: v })}
              autoCapitalize="none"
              placeholder="AAAA-MM-DD"
            />

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row flex-wrap justify-between gap-2">
              {form.id ? (
                <View className="flex-row gap-2">
                  <Button
                    label={t.common.delete}
                    variant="ghost"
                    onPress={() => {
                      const d = query.data?.find((x) => x.id === form.id) ?? null;
                      setForm(null);
                      setToDelete(d);
                    }}
                  />
                  {query.data?.find((x) => x.id === form.id)?.status === 'pending' ? (
                    <Button
                      label={t.debts.settle}
                      variant="secondary"
                      onPress={() => {
                        const d = query.data?.find((x) => x.id === form.id) ?? null;
                        setForm(null);
                        setToSettle(d);
                      }}
                    />
                  ) : null}
                </View>
              ) : (
                <View />
              )}
              <Button
                label={t.common.save}
                loading={save.isPending}
                disabled={!form.description.trim() || form.amount <= 0}
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
        title={t.debts.edit}
        message={t.debts.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
      <ConfirmSheet
        open={toSettle !== null}
        title={t.debts.settle}
        message={t.debts.confirmSettle}
        confirmLabel={t.debts.settle}
        loading={settle.isPending}
        onConfirm={() => toSettle && settle.mutate(toSettle.id)}
        onClose={() => setToSettle(null)}
      />
    </Screen>
  );

  function openCreate() {
    setForm({
      id: null,
      description: '',
      amount: 0,
      direction: 'i_owe',
      counterparty: '',
      dueDate: '',
      notes: '',
    });
  }
}
