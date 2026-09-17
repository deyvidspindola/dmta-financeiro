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
import { getQuickActions, type QuickAction } from '@/lib/quickActions';

function FabCircle({ action, onPress }: { action: QuickAction; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={action.label} onPress={onPress} className="items-center gap-2">
      <View className="size-16 items-center justify-center rounded-full bg-surface-2 shadow-sm">
        <Feather name={action.icon} size={26} color={action.color} />
      </View>
      <Text className="text-center text-xs font-medium text-white">{action.label}</Text>
    </Pressable>
  );
}

// Raio do semicírculo (px) e os 4 ângulos onde cada atalho fica — 0° é a
// direita e o ângulo cresce sentido anti-horário (matemática padrão), então
// 30°/150° ficam mais pro lado (mais baixos) e 70°/110° ficam mais em cima,
// perto do topo do arco — igual ao leque do Mobills sobre o botão "+".
const ARC_RADIUS = 108;
const ARC_WIDTH = 300;
const ARC_HEIGHT = 190;
const ARC_ITEM_WIDTH = 100;
const ARC_ANGLES_DEG = [150, 110, 70, 30] as const;

function arcPosition(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const centerX = ARC_WIDTH / 2 + ARC_RADIUS * Math.cos(rad);
  const centerY = ARC_HEIGHT - ARC_RADIUS * Math.sin(rad);
  return { left: centerX - ARC_ITEM_WIDTH / 2, top: centerY - 32 };
}

// Leque de opções do "+", igual ao padrão do Mobills: em vez de ir direto
// pra um formulário genérico, o toque abre um semicírculo de atalhos
// (transferência, receita, despesa no cartão, despesa) — cada um já leva o
// tipo certo pra `/new` via param, ou pra aba Cartões (compra no cartão
// exige escolher o cartão primeiro, feito lá). Ordem esquerda→direita
// acompanha o arco: transferência/receita do lado esquerdo (a receita mais
// alta, perto do topo), despesa no cartão/despesa do lado direito.
//
// "Segurança" (apagar todos os dados) NÃO fica aqui — é uma ação sensível
// demais pra um atalho de toque rápido; mora em Mais > Segurança
// (app/security.tsx), junto dos outros cadastros/configurações.
function FabButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const actions = getQuickActions(router);

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: 56 + insets.bottom - 12 }}
      pointerEvents="box-none"
    >
      {open ? (
        <View
          className="mb-2"
          style={{ width: ARC_WIDTH, height: ARC_HEIGHT }}
          pointerEvents="box-none"
        >
          {actions.map((action, i) => (
            <View
              key={action.key}
              style={{
                position: 'absolute',
                width: ARC_ITEM_WIDTH,
                ...arcPosition(ARC_ANGLES_DEG[i]!),
              }}
            >
              <FabCircle
                action={action}
                onPress={() => {
                  onToggle();
                  action.onPress();
                }}
              />
            </View>
          ))}
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={open ? t.nav.fabClose : t.nav.quickAdd}
        onPress={onToggle}
        className="size-14 items-center justify-center rounded-full bg-accent-600 shadow-lg active:bg-accent-700"
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
          tabBarActiveTintColor: isDark ? '#a78bfa' : '#7c3aed',
          tabBarInactiveTintColor: isDark ? '#6b7f79' : '#7c918b',
          tabBarStyle: {
            backgroundColor: isDark ? '#1b1a25' : '#ffffff',
            borderTopColor: isDark ? '#2c2a3a' : '#e3e9e7',
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
          className="absolute inset-0 bg-black/70"
          onPress={() => setFabOpen(false)}
        />
      ) : null}
      <FabButton open={fabOpen} onToggle={() => setFabOpen((o) => !o)} />
    </View>
  );
}
