import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button, Card, Screen, Text } from '@/components/ui';
import { format, t } from '@/i18n';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';

/**
 * Placeholder pós-login — só fecha o fluxo login -> contexto -> início.
 * As telas reais (dashboard, lançamentos, cartões...) chegam no trilho B (B1+).
 */
export default function HomeScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const scopeChosen = useAuthStore((s) => s.scopeChosen);
  const user = useAuthStore((s) => s.user);
  const contexts = useAuthStore((s) => s.contexts);
  const activeScope = useAuthStore((s) => s.activeScope);
  const clearSession = useAuthStore((s) => s.clearSession);

  if (!token) return <Redirect href="/login" />;
  if (!scopeChosen) return <Redirect href="/select-context" />;

  const activeLabel =
    activeScope === CONSOLIDATED
      ? t.contextPicker.consolidated
      : (contexts.find((c) => c.id === activeScope)?.name ?? activeScope);

  return (
    <Screen>
      <View className="flex-1 gap-6 pt-6">
        <Text variant="heading">
          {format(t.homePlaceholder.greeting, { name: user?.name ?? '' })}
        </Text>

        <Card className="gap-1">
          <Text variant="muted">{t.homePlaceholder.activeContext}</Text>
          <Text variant="title">{activeLabel}</Text>
        </Card>

        <Text variant="muted">{t.homePlaceholder.soon}</Text>

        <View className="mt-auto gap-3 pb-4">
          <Button
            label={t.homePlaceholder.changeContext}
            variant="secondary"
            onPress={() => router.replace('/select-context')}
          />
          <Button
            label={t.homePlaceholder.logout}
            variant="ghost"
            onPress={() => {
              clearSession();
              router.replace('/login');
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
