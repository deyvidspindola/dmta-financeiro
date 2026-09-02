import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { contextsApi } from '@/api';
import { Button, PressableCard, Screen, Text } from '@/components/ui';
import { t } from '@/i18n';
import { CONSOLIDATED, useAuthStore, type ActiveScope } from '@/store/authStore';

export default function SelectContextScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const storedContexts = useAuthStore((s) => s.contexts);
  const setContexts = useAuthStore((s) => s.setContexts);
  const setActiveScope = useAuthStore((s) => s.setActiveScope);

  const query = useQuery({
    queryKey: ['contexts'],
    queryFn: contextsApi.listContexts,
    initialData: storedContexts.length ? storedContexts : undefined,
  });

  if (!token) return <Redirect href="/login" />;

  function choose(scope: ActiveScope) {
    if (query.data) setContexts(query.data);
    setActiveScope(scope);
    router.replace('/(tabs)');
  }

  const contexts = query.data ?? [];

  return (
    <Screen>
      <View className="flex-1 gap-4 pt-4">
        <View className="gap-1">
          <Text variant="heading">{t.contextPicker.title}</Text>
          <Text variant="muted">{t.contextPicker.subtitle}</Text>
        </View>

        {query.isLoading && !contexts.length ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : query.isError && !contexts.length ? (
          <View className="flex-1 items-center justify-center gap-4">
            <Text variant="error">{t.contextPicker.loadError}</Text>
            <Button
              label={t.contextPicker.retry}
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="gap-3 pb-6">
            <PressableCard onPress={() => choose(CONSOLIDATED)} className="gap-1">
              <Text variant="title">{t.contextPicker.consolidated}</Text>
              <Text variant="muted">{t.contextPicker.consolidatedHint}</Text>
            </PressableCard>

            {contexts.map((context) => (
              <PressableCard
                key={context.id}
                onPress={() => choose(context.id)}
                className="flex-row items-center justify-between"
              >
                <View className="gap-0.5">
                  <Text variant="title">{context.name}</Text>
                  <Text variant="muted">
                    {context.type === 'pf' ? t.nav.pf : t.nav.pj}
                    {context.company ? ` · ${context.company.name}` : ''}
                  </Text>
                </View>
              </PressableCard>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
