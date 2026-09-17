import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { getQuickActions } from '@/lib/quickActions';

/**
 * Fileira fixa de atalhos na Home (transferir/receita/cartão/despesa) — as
 * mesmas 4 ações do leque do FAB (`getQuickActions`, ver
 * `app/(tabs)/_layout.tsx`), só que sempre visíveis em vez de precisar
 * abrir o "+" primeiro. Ver seção 4.2 do guia de migração de tema.
 */
export function QuickActions() {
  const router = useRouter();
  const actions = getQuickActions(router);

  return (
    <View className="flex-row justify-between">
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityLabel={action.label}
          onPress={action.onPress}
          className="items-center gap-2"
        >
          <View className="size-[50px] items-center justify-center rounded-2xl bg-surface-2">
            <Feather name={action.icon} size={22} color={action.color} />
          </View>
          <Text className="text-center text-[10.5px] font-medium" numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
