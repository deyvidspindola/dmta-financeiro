import '@/styles/global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { bindAuthToken } from '@/api';
import { queryClient } from '@/query/client';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { hydrateAuthToken, useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

// O http.ts lê o token do store (que espelha o expo-secure-store).
bindAuthToken(() => useAuthStore.getState().token);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // Rehidrata a preferência de tema (aplica no NativeWind via onRehydrateStorage).
  useThemeStore();

  // Puxa atualizações OTA em segundo plano (no-op em desenvolvimento).
  useAutoUpdate();

  useEffect(() => {
    let active = true;
    hydrateAuthToken().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
