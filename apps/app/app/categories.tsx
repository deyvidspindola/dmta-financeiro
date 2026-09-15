import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Button,
  CategoryIcon,
  ConfirmSheet,
  ListRow,
  Screen,
  SelectField,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import type { Category, MoneyDirection } from '@/types/models';

type FormState = {
  id: string | null;
  name: string;
  type: MoneyDirection;
  parentId: string | null;
};

export default function CategoriesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [tab, setTab] = useState<MoneyDirection>('expense');
  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['categories', activeScope, tab],
    queryFn: () => categoriesApi.listCategories(activeScope, { type: tab }),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const roots = useMemo(() => (query.data ?? []).filter((c) => c.parent_id === null), [query.data]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of query.data ?? []) {
      if (c.parent_id) {
        const bucket = map.get(c.parent_id) ?? [];
        bucket.push(c);
        map.set(c.parent_id, bucket);
      }
    }
    return map;
  }, [query.data]);

  const parentOptions = useMemo(
    () => [
      { value: '', label: t.categories.parentNone },
      ...roots.map((c) => ({ value: c.id, label: c.name })),
    ],
    [roots],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const save = useMutation({
    mutationFn: (f: FormState) =>
      f.id
        ? categoriesApi.updateCategory(activeScope, f.id, { name: f.name.trim() })
        : categoriesApi.createCategory(activeScope, {
            name: f.name.trim(),
            type: f.type,
            parent_id: f.parentId || null,
          }),
    onSuccess: () => {
      void invalidate();
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(activeScope, id),
    onSuccess: () => {
      void invalidate();
      setToDelete(null);
    },
    onError: () => setToDelete(null),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.categories.listTitle}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {isConsolidated ? (
        <Text variant="muted">{t.accounts.needContext}</Text>
      ) : (
        <View className="gap-4">
          <View className="flex-row rounded-xl border border-line bg-surface p-1">
            {(['expense', 'income'] as MoneyDirection[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setTab(option)}
                className={cn('flex-1 items-center rounded-lg py-2', tab === option && 'bg-canvas')}
              >
                <Text
                  className={cn(
                    'text-sm',
                    tab === option ? 'font-semibold text-fg' : 'text-fg-muted',
                  )}
                >
                  {t.categories.types[option]}
                </Text>
              </Pressable>
            ))}
          </View>

          {query.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : query.isError ? (
            <Text variant="error">{t.common.error}</Text>
          ) : roots.length === 0 ? (
            <Text variant="muted">{t.categories.empty}</Text>
          ) : (
            <View className="rounded-2xl border border-line bg-surface">
              {roots.map((root) => (
                <View key={root.id}>
                  <ListRow
                    onPress={() =>
                      setForm({ id: root.id, name: root.name, type: tab, parentId: null })
                    }
                    leading={<CategoryIcon categoryId={root.id} name={root.name} size="sm" />}
                  >
                    <Text className="font-medium">{root.name}</Text>
                  </ListRow>
                  {(childrenOf.get(root.id) ?? []).map((child) => (
                    <ListRow
                      key={child.id}
                      onPress={() =>
                        setForm({ id: child.id, name: child.name, type: tab, parentId: root.id })
                      }
                      leading={<CategoryIcon categoryId={child.id} name={child.name} size="sm" />}
                    >
                      <Text className="text-fg-muted">↳ {child.name}</Text>
                    </ListRow>
                  ))}
                </View>
              ))}
            </View>
          )}

          <Button
            label={t.categories.create}
            onPress={() => setForm({ id: null, name: '', type: tab, parentId: null })}
          />
        </View>
      )}

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.id ? t.categories.edit : t.categories.create}
      >
        {form ? (
          <View className="gap-4">
            <TextField
              label={t.categories.name}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            {!form.id ? (
              <>
                <SelectField
                  label={t.categories.type}
                  placeholder={t.common.select}
                  value={form.type}
                  options={(['expense', 'income'] as MoneyDirection[]).map((v) => ({
                    value: v,
                    label: t.categories.types[v],
                  }))}
                  onChange={(v) => setForm({ ...form, type: v as MoneyDirection, parentId: null })}
                />
                <SelectField
                  label={t.categories.parent}
                  placeholder={t.categories.parentNone}
                  value={form.parentId ?? ''}
                  options={parentOptions}
                  onChange={(v) => setForm({ ...form, parentId: v || null })}
                />
              </>
            ) : null}

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row justify-between gap-2">
              {form.id ? (
                <Button
                  label={t.common.delete}
                  variant="ghost"
                  onPress={() => {
                    const cat = query.data?.find((c) => c.id === form.id) ?? null;
                    setForm(null);
                    setToDelete(cat);
                  }}
                />
              ) : (
                <View />
              )}
              <Button
                label={t.common.save}
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
        title={t.categories.edit}
        message={t.categories.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </Screen>
  );
}
