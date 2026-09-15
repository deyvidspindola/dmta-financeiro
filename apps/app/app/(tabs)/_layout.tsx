import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useNotificationCaptureSync } from '@/hooks/useNotificationCaptureSync';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { t } from '@/i18n';

type FabAction = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
};

// Leque de opções do "+", igual ao padrão do Mobills: em vez de ir direto
// pra um formulário genérico, o toque abre 4 atalhos coloridos (receita,
// despesa, despesa no cartão, transferência) — cada um já leva o tipo certo
// pra `/new` via param, ou pra aba Cartões (compra no cartão exige escolher
// o cartão primeiro, feito lá).
function FabButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const actions: FabAction[] = [
    {
      key: 'transfer',
      label: t.nav.fabTransfer,
      icon: 'repeat',
      color: '#2563eb',
      onPress: () => router.push({ pathname: '/new', params: { type: 'transfer' } }),
    },
    {
      key: 'card',
      label: t.nav.fabCardExpense,
      icon: 'credit-card',
      color: '#7c3aed',
      onPress: () => router.push('/(tabs)/cards'),
    },
    {
      key: 'expense',
      label: t.newTransaction.typeExpense,
      icon: 'arrow-down-circle',
      color: '#dc2626',
      onPress: () => router.push({ pathname: '/new', params: { type: 'expense' } }),
    },
    {
      key: 'income',
      label: t.newTransaction.typeIncome,
      icon: 'arrow-up-circle',
      color: '#059669',
      onPress: () => router.push({ pathname: '/new', params: { type: 'income' } }),
    },
  ];

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: 56 + insets.bottom - 12 }}
      pointerEvents="box-none"
    >
      {open ? (
        <View className="mb-3 items-end gap-3 pr-1">
          {actions.map((action) => (
            <Pressable
              key={action.key}
              accessibilityLabel={action.label}
              onPress={() => {
                onToggle();
                action.onPress();
              }}
              className="flex-row items-center gap-3"
            >
              <View
                className="rounded-lg bg-surface px-2.5 py-1.5 shadow-sm"
                style={{ elevation: 3 }}
              >
                <Text className="text-sm font-medium text-fg">{action.label}</Text>
              </View>
              <View
                className="size-11 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: action.color, elevation: 6 }}
              >
                <Feather name={action.icon} size={20} color="#fff" />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={open ? t.nav.fabClose : t.nav.quickAdd}
        onPress={onToggle}
        className="size-14 items-center justify-center rounded-full bg-brand-600 shadow-lg active:bg-brand-700"
        style={{ elevation: 8 }}
      >
        <Feather name={open ? 'x' : 'plus'} size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const sessionRoute = useSessionRoute();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [fabOpen, setFabOpen] = useState(false);

  useNotificationCaptureSync();

  if (sessionRoute !== '/(tabs)') {
    return <Redirect href={sessionRoute} />;
  }

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? '#34d399' : '#059669',
          tabBarInactiveTintColor: isDark ? '#6b7f79' : '#7c918b',
          tabBarStyle: {
            backgroundColor: isDark ? '#121917' : '#ffffff',
            borderTopColor: isDark ? '#263130' : '#e3e9e7',
            paddingBottom: insets.bottom,
            height: 56 + insets.bottom,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.nav.home,
            tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: t.nav.transactions,
            tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="cards"
          options={{
            title: t.nav.creditCards,
            tabBarIcon: ({ color, size }) => (
              <Feather name="credit-card" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t.nav.more,
            tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
          }}
        />
      </Tabs>
      {fabOpen ? (
        <Pressable
          accessibilityLabel={t.nav.fabClose}
          className="absolute inset-0 bg-black/30"
          onPress={() => setFabOpen(false)}
        />
      ) : null}
      <FabButton open={fabOpen} onToggle={() => setFabOpen((o) => !o)} />
    </View>
  );
}
