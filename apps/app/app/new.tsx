import { Redirect } from 'expo-router';
import { Screen, Text } from '@/components/ui';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { t } from '@/i18n';

export default function NewTransactionScreen() {
  const sessionRoute = useSessionRoute();

  if (sessionRoute !== '/(tabs)') {
    return <Redirect href={sessionRoute} />;
  }

  return (
    <Screen center>
      <Text variant="title">{t.newTransaction.title}</Text>
      <Text variant="muted">{t.common.comingSoon}</Text>
    </Screen>
  );
}
