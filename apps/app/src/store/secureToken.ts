import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token do Sanctum guardado no keychain/keystore do dispositivo via
 * `expo-secure-store` (NÃO AsyncStorage — D-10 / regra da tarefa B0).
 *
 * `expo-secure-store` não roda no target web; lá caímos em `localStorage`
 * (o build web do apps/app é a substituição do apps/web atual, que já
 * guarda o token em localStorage).
 */
const KEY = 'dmta_financeiro_token';
const isWeb = Platform.OS === 'web';

export async function getStoredToken(): Promise<string | null> {
  try {
    if (isWeb) {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    }
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // já não existe — no-op
  }
}
