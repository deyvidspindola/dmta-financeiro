import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
import { ColorSwatchPicker } from '@/components/categories/ColorSwatchPicker';
import { IconSwatchPicker } from '@/components/categories/IconSwatchPicker';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { categoryColor, CATEGORY_COLORS } from '@/lib/categoryColor';
import { categoryIconName, CATEGORY_ICON_CHOICES, type FeatherName } from '@/lib/categoryIcon';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import type { Category, MoneyDirection } from '@/types/models';

type FormState = {
  id: string | null;
  name: string;
  type: MoneyDirection;
  parentId: string | null;
  color: string;
  icon: FeatherName;
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

  // Reparentar uma categoria que já tem filha própria não é permitido (o
  // modelo só tem 2 níveis — ver docblock de UpdateCategory na API): some
  // o campo em vez de deixar o usuário escolher algo que o backend recusa.
  const editingHasChildren = form?.id ? (childrenOf.get(form.id)?.length ?? 0) > 0 : false;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const openCreate = (parentId: string | null = null) => {
    setFormError(null);
    setForm({
      id: null,
      name: '',
      type: tab,
      parentId,
      color: CATEGORY_COLORS[0]!,
      icon: CATEGORY_ICON_CHOICES[0]!,
    });
  };

  const openEdit = (category: Category) => {
    setFormError(null);
    setForm({
      id: category.id,
      name: category.name,
      type: category.type,
      parentId: category.parent_id,
      color: category.color ?? categoryColor(category.id),
      icon: (category.icon as FeatherName | null) ?? categoryIconName(category.name),
    });
  };

  const save = useMutation({
    mutationFn: (f: FormState) =>
      f.id
        ? categoriesApi.updateCategory(activeScope, f.id, {
            name: f.name.trim(),
            color: f.color,
            icon: f.icon,
            ...(editingHasChildren ? {} : { parent_id: f.parentId }),
          })
        : categoriesApi.createCategory(activeScope, {
            name: f.name.trim(),
            type: f.type,
            parent_id: f.parentId,
            color: f.color,
            icon: f.icon,
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
    <Screen
      scroll
      fab={
        isConsolidated ? undefined : (
          <Pressable
            accessibilityLabel={t.categories.create}
            onPress={() => openCreate(null)}
            className="size-14 items-center justify-center rounded-full bg-brand-600 shadow-lg active:bg-brand-700"
          >
            <Feather name="plus" size={24} color="#fff" />
          </Pressable>
        )
      }
    >
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
            <View className="rounded-2xl border border-line bg-surface pb-24">
              {roots.map((root) => (
                <View key={root.id}>
                  <ListRow
                    onPress={() => openEdit(root)}
                    leading={
                      <CategoryIcon
                        categoryId={root.id}
                        name={root.name}
                        color={root.color}
                        icon={root.icon as FeatherName | null}
                        size="sm"
                      />
                    }
                  >
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 font-medium" numberOfLines={1}>
                        {root.name}
                      </Text>
                      <Pressable
                        onPress={() => openCreate(root.id)}
                        hitSlop={8}
                        className="size-7 items-center justify-center rounded-full bg-surface-2 active:opacity-70"
                      >
                        <Feather name="plus" size={14} color="#7c918b" />
                      </Pressable>
                      {/* "⋮" vai direto pro excluir (com confirmação) — editar já
                          é o toque na linha, não duplicamos num menu à parte. */}
                      <Pressable
                        onPress={() => setToDelete(root)}
                        hitSlop={8}
                        className="size-7 items-center justify-center active:opacity-70"
                      >
                        <Feather name="more-vertical" size={16} color="#7c918b" />
                      </Pressable>
                    </View>
                  </ListRow>
                  {(childrenOf.get(root.id) ?? []).map((child) => (
                    <ListRow
                      key={child.id}
                      onPress={() => openEdit(child)}
                      leading={
                        <View className="w-7 items-center">
                          <Feather name="corner-down-right" size={14} color="#7c918b" />
                        </View>
                      }
                    >
                      <View className="flex-row items-center gap-2">
                        <View
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: child.color ?? categoryColor(child.id) }}
                        />
                        <Text className="text-fg-muted" numberOfLines={1}>
                          {child.name}
                        </Text>
                      </View>
                    </ListRow>
                  ))}
                </View>
              ))}
            </View>
          )}
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
              <SelectField
                label={t.categories.type}
                placeholder={t.common.select}
                value={form.type}
                options={(['expense', 'income'] as MoneyDirection[]).map((v) => ({
                  value: v,
                  label: t.categories.types[v],
                }))}
                onChange={(v) => {
                  const type = v as MoneyDirection;
                  setForm({ ...form, type, parentId: null });
                  setTab(type);
                }}
              />
            ) : null}

            <ColorSwatchPicker
              value={form.color}
              onChange={(color) => setForm({ ...form, color })}
            />
            <IconSwatchPicker
              value={form.icon}
              tint={form.color}
              onChange={(icon) => setForm({ ...form, icon })}
            />

            {editingHasChildren ? (
              <Text variant="muted" className="text-xs">
                {t.categories.parent}: {t.categories.parentNone}
              </Text>
            ) : (
              <SelectField
                label={t.categories.parent}
                placeholder={t.categories.parentNone}
                value={form.parentId ?? ''}
                options={parentOptions.filter((o) => o.value !== form.id)}
                onChange={(v) => setForm({ ...form, parentId: v || null })}
              />
            )}

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
