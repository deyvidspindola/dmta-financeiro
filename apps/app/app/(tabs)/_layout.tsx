import { Pressable, View } from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationCaptureSync } from '@/hooks/useNotificationCaptureSync';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { t } from '@/i18n';

function FabButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: 56 + insets.bottom - 12 }}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityLabel={t.nav.quickAdd}
        onPress={() => router.push('/new')}
        className="size-14 items-center justify-center rounded-full bg-brand-600 shadow-lg active:bg-brand-700"
        style={{ elevation: 8 }}
      >
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const sessionRoute = useSessionRoute();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <FabButton />
    </View>
  );
}
