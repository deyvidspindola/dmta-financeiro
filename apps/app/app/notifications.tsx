import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import {
  notificationAccessGranted,
  openNotificationAccessSettings,
} from '@/lib/notificationPermission';
import { accountsApi, categoriesApi, notificationCapturesApi } from '@/api';
import { ApiError } from '@/api/http';
import type { NotificationCapture } from '@/api/notificationCaptures';
import {
  Badge,
  Button,
  ConfirmSheet,
  DateField,
  MoneyField,
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
import { useAuthStore } from '@/store/authStore';

type SaveForm = {
  capture: NotificationCapture;
  contextId: string;
  accountId: string | null;
  categoryId: string | null;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  occurredAt: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const contexts = useAuthStore((s) => s.contexts);

  const [form, setForm] = useState<SaveForm | null>(null);
  const [toIgnore, setToIgnore] = useState<NotificationCapture | null>(null);
  const [dupWarning, setDupWarning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Fonte da verdade: relê a permissão a cada volta ao foco (o usuário
  // concede numa tela de Settings, fora do app) + algumas tentativas
  // curtas logo depois (o serviço nativo demora um instante pra ligar).
  const [accessGranted, setAccessGranted] = useState(() => notificationAccessGranted());
  const retryTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const recheckAccess = () => setAccessGranted(notificationAccessGranted());

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // valor inicial já vem do useState; aqui só reagimos ao foco
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        recheckAccess();
        retryTimers.current.push(setTimeout(recheckAccess, 900), setTimeout(recheckAccess, 2500));
      }
    });
    return () => {
      sub.remove();
      retryTimers.current.forEach(clearTimeout);
      retryTimers.current = [];
    };
  }, []);

  const permMissing = Platform.OS === 'android' && !accessGranted;

  const capturesQuery = useQuery({
    queryKey: ['notification-captures', 'pending'],
    queryFn: () => notificationCapturesApi.listCaptures('pending'),
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', form?.contextId],
    queryFn: () => accountsApi.listAccounts(form!.contextId),
    enabled: Boolean(form?.contextId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', form?.contextId, form?.type],
    queryFn: () => categoriesApi.listCategories(form!.contextId, { type: form!.type }),
    enabled: Boolean(form?.contextId),
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
  const contextOptions = useMemo(
    () => contexts.map((c) => ({ value: c.id, label: c.name })),
    [contexts],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notification-captures'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const save = useMutation({
    mutationFn: ({ f, force }: { f: SaveForm; force: boolean }) =>
      notificationCapturesApi.saveCapture(f.capture.id, {
        context_id: f.contextId,
        account_id: f.accountId!,
        category_id: f.categoryId || null,
        type: f.type,
        description: f.description.trim(),
        amount: f.amount,
        occurred_at: f.occurredAt,
        force,
      }),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setDupWarning(false);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 422 && /lançamento igual/i.test(err.message)) {
        setDupWarning(true);
        return;
      }
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error);
    },
  });

  const ignore = useMutation({
    mutationFn: (capture: NotificationCapture) => notificationCapturesApi.ignoreCapture(capture.id),
    onSuccess: () => {
      invalidate();
      setToIgnore(null);
    },
    onError: () => setToIgnore(null),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  const openForm = (capture: NotificationCapture) => {
    setFormError(null);
    setForm({
      capture,
      contextId: contexts[0]?.id ?? '',
      accountId: null,
      categoryId: null,
      type: capture.guessed_type ?? 'expense',
      description: capture.guessed_description ?? capture.title ?? capture.app_label ?? '',
      amount: capture.guessed_amount ?? 0,
      occurredAt: capture.guessed_date ?? todayIso(),
    });
  };

  const captures = capturesQuery.data ?? [];

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.notifications.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {permMissing ? (
        <View className="mb-4 gap-2 rounded-2xl border border-line bg-surface p-4">
          <Text className="font-medium">{t.notifications.permissionTitle}</Text>
          <Text variant="muted" className="text-xs">
            {t.notifications.permissionHint}
          </Text>
          <Button label={t.notifications.grant} onPress={openNotificationAccessSettings} />
          <Pressable onPress={recheckAccess} hitSlop={8} className="items-center py-1">
            <Text variant="muted" className="text-xs underline">
              {t.notifications.alreadyGranted}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {capturesQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : capturesQuery.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : captures.length === 0 ? (
        <Text variant="muted">{t.notifications.empty}</Text>
      ) : (
        <View className="gap-3">
          {captures.map((capture) => (
            <View key={capture.id} className="gap-2 rounded-2xl border border-line bg-surface p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="font-medium" numberOfLines={1}>
                  {capture.app_label ?? capture.package_name}
                </Text>
                <Text variant="muted" className="text-xs">
                  {formatDateShort(capture.posted_at.slice(0, 10))}
                </Text>
              </View>
              <Text variant="muted" className="text-xs" numberOfLines={3}>
                {capture.body}
              </Text>
              <View className="flex-row flex-wrap items-center gap-2">
                {capture.guessed_amount != null ? (
                  <Badge tone={capture.guessed_type === 'income' ? 'brand' : 'negative'}>
                    {t.common.currency} {capture.guessed_amount.toFixed(2)}
                  </Badge>
                ) : null}
                {capture.guessed_type ? (
                  <Badge tone={capture.guessed_type === 'income' ? 'brand' : 'negative'}>
                    {capture.guessed_type === 'income'
                      ? t.newTransaction.typeIncome
                      : t.newTransaction.typeExpense}
                  </Badge>
                ) : null}
              </View>
              <View className="mt-1 flex-row gap-2">
                <Button
                  label={t.notifications.save}
                  className="flex-1"
                  onPress={() => openForm(capture)}
                />
                <Pressable
                  onPress={() => setToIgnore(capture)}
                  hitSlop={8}
                  className="items-center justify-center rounded-xl border border-line px-3 active:bg-surface-2"
                >
                  <Feather name="x" size={18} color="#7c918b" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={t.notifications.saveTitle}
      >
        {form ? (
          <View className="gap-4">
            <View className="flex-row rounded-xl border border-line bg-surface p-1">
              {(['expense', 'income'] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setForm({ ...form, type: option, categoryId: null })}
                  className={`flex-1 items-center rounded-lg py-2 ${
                    form.type === option ? 'bg-canvas' : ''
                  }`}
                >
                  <Text className="text-sm">
                    {option === 'income'
                      ? t.newTransaction.typeIncome
                      : t.newTransaction.typeExpense}
                  </Text>
                </Pressable>
              ))}
            </View>
            <SelectField
              label={t.common.context}
              placeholder={t.common.select}
              value={form.contextId}
              options={contextOptions}
              onChange={(v) =>
                setForm({ ...form, contextId: v, accountId: null, categoryId: null })
              }
            />
            <SelectField
              label={t.newTransaction.account}
              placeholder={t.newTransaction.accountPlaceholder}
              value={form.accountId}
              options={accountOptions}
              onChange={(v) => setForm({ ...form, accountId: v })}
            />
            <SelectField
              label={t.newTransaction.category}
              placeholder={t.newTransaction.categoryPlaceholder}
              value={form.categoryId ?? ''}
              options={categoryOptions}
              onChange={(v) => setForm({ ...form, categoryId: v || null })}
            />
            <TextField
              label={t.newTransaction.description}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
            <MoneyField
              label={t.newTransaction.amount}
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
            />
            <DateField
              label={t.newTransaction.date}
              value={form.occurredAt}
              onChange={(v) => setForm({ ...form, occurredAt: v })}
            />

            {formError ? <Text variant="error">{formError}</Text> : null}

            <Button
              label={t.common.save}
              loading={save.isPending}
              disabled={
                !form.contextId || !form.accountId || !form.description.trim() || form.amount <= 0
              }
              onPress={() => {
                setFormError(null);
                save.mutate({ f: form, force: false });
              }}
            />
          </View>
        ) : null}
      </Sheet>

      <ConfirmSheet
        open={dupWarning}
        title={t.notifications.duplicateTitle}
        message={t.notifications.duplicateMessage}
        confirmLabel={t.notifications.saveAnyway}
        onConfirm={() => form && save.mutate({ f: form, force: true })}
        onClose={() => setDupWarning(false)}
      />

      <ConfirmSheet
        open={toIgnore !== null}
        title={t.notifications.ignoreTitle}
        message={t.notifications.ignoreMessage}
        confirmLabel={t.notifications.ignore}
        tone="danger"
        loading={ignore.isPending}
        onConfirm={() => toIgnore && ignore.mutate(toIgnore)}
        onClose={() => setToIgnore(null)}
      />
    </Screen>
  );
}
