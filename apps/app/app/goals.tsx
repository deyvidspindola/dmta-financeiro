import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Badge,
  Button,
  ConfirmSheet,
  DateField,
  MoneyField,
  ProgressBar,
  Screen,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import type { Goal } from '@/types/models';

type FormState = {
  id: string | null;
  name: string;
  target: number;
  targetDate: string;
  notes: string;
};

export default function GoalsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Goal | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['goals', activeScope],
    queryFn: () => goalsApi.listGoals(activeScope),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['goals'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        name: f.name.trim(),
        target_amount: f.target,
        target_date: f.targetDate.trim() || null,
        notes: f.notes.trim() || null,
      };
      return f.id
        ? goalsApi.updateGoal(activeScope, f.id, body)
        : goalsApi.createGoal(activeScope, body);
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const remove = useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(activeScope, id),
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
        <Text variant="title">{t.goals.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {isConsolidated ? (
        <Text variant="muted">{t.goals.needContext}</Text>
      ) : query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : query.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (
        <View className="gap-4">
          {(query.data ?? []).length === 0 ? (
            <Text variant="muted">{t.goals.empty}</Text>
          ) : (
            <View className="gap-3">
              {(query.data ?? []).map((goal) => (
                <Pressable
                  key={goal.id}
                  onPress={() =>
                    setForm({
                      id: goal.id,
                      name: goal.name,
                      target: goal.target_amount,
                      targetDate: goal.target_date ?? '',
                      notes: goal.notes ?? '',
                    })
                  }
                  className="gap-2 rounded-2xl border border-line bg-surface p-4 active:bg-surface-2"
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-medium" numberOfLines={1}>
                      {goal.name}
                    </Text>
                    {goal.status === 'completed' ? (
                      <Badge tone="brand">{t.goals.statuses.completed}</Badge>
                    ) : null}
                  </View>
                  <ProgressBar value={goal.percent_complete} tone="positive" />
                  <Text variant="muted" className="text-xs tabular-nums">
                    {formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}
                    {goal.target_date ? ` · ${goal.target_date}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Button
            label={t.goals.create}
            onPress={() => setForm({ id: null, name: '', target: 0, targetDate: '', notes: '' })}
          />
        </View>
      )}

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.id ? t.goals.edit : t.goals.create}
      >
        {form ? (
          <View className="gap-4">
            <TextField
              label={t.goals.name}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <MoneyField
              label={t.goals.targetAmount}
              value={form.target}
              onChange={(v) => setForm({ ...form, target: v })}
            />
            <DateField
              label={t.goals.targetDate}
              value={form.targetDate}
              onChange={(v) => setForm({ ...form, targetDate: v })}
              optional
            />
            <TextField
              label={t.goals.notes}
              value={form.notes}
              onChangeText={(v) => setForm({ ...form, notes: v })}
              multiline
            />

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row justify-between gap-2">
              {form.id ? (
                <Button
                  label={t.common.delete}
                  variant="ghost"
                  onPress={() => {
                    const g = query.data?.find((x) => x.id === form.id) ?? null;
                    setForm(null);
                    setToDelete(g);
                  }}
                />
              ) : (
                <View />
              )}
              <Button
                label={t.common.save}
                loading={save.isPending}
                disabled={!form.name.trim() || form.target <= 0}
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
        title={t.goals.edit}
        message={t.goals.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </Screen>
  );
}
