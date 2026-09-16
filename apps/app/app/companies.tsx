import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contextsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Badge,
  Button,
  PressableCard,
  Screen,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess } from '@/store/toastStore';

type FormState = { contextName: string; companyName: string; document: string };
const EMPTY: FormState = { contextName: '', companyName: '', document: '' };

export default function CompaniesScreen() {
  const router = useRouter();
  const sessionRoute = useSessionRoute();
  const queryClient = useQueryClient();
  const storedContexts = useAuthStore((s) => s.contexts);
  const setContexts = useAuthStore((s) => s.setContexts);
  const setActiveScope = useAuthStore((s) => s.setActiveScope);

  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const contextsQuery = useQuery({
    queryKey: ['contexts'],
    queryFn: contextsApi.listContexts,
    initialData: storedContexts.length ? storedContexts : undefined,
  });

  const companies = (contextsQuery.data ?? []).filter((c) => c.type === 'pj');

  const create = useMutation({
    mutationFn: (f: FormState) =>
      contextsApi.createCompany({
        name: f.contextName.trim(),
        companyName: f.companyName.trim(),
        companyDocument: f.document.trim() || null,
      }),
    onSuccess: (context) => {
      const next = [...(contextsQuery.data ?? []), context];
      queryClient.setQueryData(['contexts'], next);
      setContexts(next);
      toastSuccess(t.companies.created);
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.companies.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      {contextsQuery.isLoading ? (
        <View className="gap-3">
          <Skeleton className="h-16 w-full" />
        </View>
      ) : contextsQuery.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (
        <View className="gap-4">
          {companies.length === 0 ? (
            <Text variant="muted">{t.companies.empty}</Text>
          ) : (
            <View className="gap-3">
              {companies.map((context) => (
                <PressableCard
                  key={context.id}
                  onPress={() => {
                    setActiveScope(context.id);
                    router.replace('/(tabs)');
                  }}
                  className="gap-1"
                >
                  <View className="flex-row items-center gap-2">
                    <Text variant="title" className="text-base">
                      {context.name}
                    </Text>
                    <Badge tone="accent">{t.nav.pj}</Badge>
                  </View>
                  <Text variant="muted">
                    {context.company?.name}
                    {context.company?.document ? ` · ${context.company.document}` : ''}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    {t.companies.switchHint}
                  </Text>
                </PressableCard>
              ))}
            </View>
          )}

          <Button label={t.companies.create} onPress={() => setForm({ ...EMPTY })} />
        </View>
      )}

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={t.companies.create}
      >
        {form ? (
          <View className="gap-4">
            <Text variant="muted" className="text-xs">
              {t.companies.hint}
            </Text>
            <TextField
              label={t.companies.contextName}
              placeholder={t.companies.contextNameHint}
              value={form.contextName}
              onChangeText={(v) => setForm({ ...form, contextName: v })}
            />
            <TextField
              label={t.companies.companyName}
              value={form.companyName}
              onChangeText={(v) => setForm({ ...form, companyName: v })}
            />
            <TextField
              label={t.companies.document}
              value={form.document}
              onChangeText={(v) => setForm({ ...form, document: v })}
            />

            {formError ? <Text variant="error">{formError}</Text> : null}

            <Button
              label={t.companies.create}
              loading={create.isPending}
              disabled={!form.contextName.trim() || !form.companyName.trim()}
              onPress={() => {
                setFormError(null);
                create.mutate(form);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
