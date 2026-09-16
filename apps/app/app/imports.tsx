import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PressableCard, Screen, Text } from '@/components/ui';
import { t } from '@/i18n';

type ImportCardProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
};

function ImportCard({ icon, title, description, onPress }: ImportCardProps) {
  return (
    <PressableCard onPress={onPress}>
      <View className="flex-row gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-600/10">
          <Feather name={icon} size={24} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-base font-semibold">{title}</Text>
          <Text variant="muted" className="text-sm leading-5">
            {description}
          </Text>
        </View>
      </View>
    </PressableCard>
  );
}

export default function ImportsPage() {
  const router = useRouter();

  return (
    <Screen scroll className="py-4">
      <Text className="mb-4 text-2xl font-bold">{t.imports.listTitle}</Text>
      <View className="gap-3">
        <ImportCard
          icon="file-text"
          title={t.imports.statementTitle}
          description={t.imports.statementHint}
          onPress={() => router.push('/import-statement')}
        />
        <ImportCard
          icon="file"
          title={t.imports.billsTitle}
          description={t.imports.billsHint}
          onPress={() => router.push('/import-bills')}
        />
        <ImportCard
          icon="credit-card"
          title={t.imports.cardInvoiceTitle}
          description={t.imports.cardInvoiceHint}
          onPress={() => router.push('/import-invoice')}
        />
      </View>
    </Screen>
  );
}
