import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SecuritySheet } from '@/components/SecuritySheet';
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

function FabCircle({ action, onPress }: { action: FabAction; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={action.label} onPress={onPress} className="items-center gap-2">
      <View className="size-16 items-center justify-center rounded-full bg-surface-2 shadow-sm">
        <Feather name={action.icon} size={26} color={action.color} />
      </View>
      <Text className="text-center text-xs font-medium text-white">{action.label}</Text>
    </Pressable>
  );
}

// Raio do semicírculo (px) e os 5 ângulos onde cada atalho fica — 0° é a
// direita e o ângulo cresce sentido anti-horário (matemática padrão), então
// os ângulos das pontas ficam mais pro lado (mais baixos) e o do meio fica
// mais em cima, perto do topo do arco — igual ao leque do Mobills sobre o
// botão "+". Raio maior que o do leque de 4 itens (era 108) porque com 5
// itens a corda entre ângulos vizinhos (2·R·sen(Δθ/2)) precisa ser ≥
// `ARC_ITEM_WIDTH`, senão as caixas de toque vizinhas se sobrepõem e o
// toque num atalho aciona o vizinho por baixo (bug real, visto em teste
// manual: tocar "Segurança" abria "Transferência").
const ARC_RADIUS = 132;
const ARC_WIDTH = 320;
const ARC_HEIGHT = 210;
const ARC_ITEM_WIDTH = 64;
const ARC_ANGLES_DEG = [155, 122.5, 90, 57.5, 25] as const;

function arcPosition(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const centerX = ARC_WIDTH / 2 + ARC_RADIUS * Math.cos(rad);
  const centerY = ARC_HEIGHT - ARC_RADIUS * Math.sin(rad);
  return { left: centerX - ARC_ITEM_WIDTH / 2, top: centerY - 32 };
}

// Leque de opções do "+", igual ao padrão do Mobills: em vez de ir direto
// pra um formulário genérico, o toque abre um semicírculo de atalhos
// (segurança, transferência, receita, despesa no cartão, despesa) — cada
// lançamento já leva o tipo certo pra `/new` via param, ou pra aba Cartões
// (compra no cartão exige escolher o cartão primeiro, feito lá).
// "Segurança" fica na ponta esquerda de propósito — é a única ação
// destrutiva do leque (abre a tela de apagar todos os dados), então longe
// do centro onde o polegar naturalmente aperta pra lançar algo.
function FabButton({
  open,
  onToggle,
  onOpenSecurity,
}: {
  open: boolean;
  onToggle: () => void;
  onOpenSecurity: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const actions: FabAction[] = [
    {
      key: 'security',
      label: t.nav.security,
      icon: 'shield',
      color: '#94a3b8',
      onPress: onOpenSecurity,
    },
    {
      key: 'transfer',
      label: t.nav.fabTransfer,
      icon: 'repeat',
      color: '#a78bfa',
      onPress: () => router.push({ pathname: '/new', params: { type: 'transfer' } }),
    },
    {
      key: 'income',
      label: t.newTransaction.typeIncome,
      icon: 'trending-up',
      color: '#34d399',
      onPress: () => router.push({ pathname: '/new', params: { type: 'income' } }),
    },
    {
      key: 'card',
      label: t.nav.fabCardExpense,
      icon: 'credit-card',
      color: '#22d3ee',
      onPress: () => router.push('/(tabs)/cards'),
    },
    {
      key: 'expense',
      label: t.newTransaction.typeExpense,
      icon: 'trending-down',
      color: '#f87171',
      onPress: () => router.push({ pathname: '/new', params: { type: 'expense' } }),
    },
  ];

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
  const [securityOpen, setSecurityOpen] = useState(false);

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
          className="absolute inset-0 bg-black/70"
          onPress={() => setFabOpen(false)}
        />
      ) : null}
      <FabButton
        open={fabOpen}
        onToggle={() => setFabOpen((o) => !o)}
        onOpenSecurity={() => setSecurityOpen(true)}
      />
      <SecuritySheet open={securityOpen} onClose={() => setSecurityOpen(false)} />
    </View>
  );
}
