import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Preferência do usuário pra travar o app com biometria (D-10). Só a
 * preferência mora aqui — se o hardware existe e está cadastrado é
 * checado em runtime por `useBiometricLock` (`expo-local-authentication`),
 * nunca guardado neste store.
 */
interface BiometricState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useBiometricStore = create<BiometricState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'dmta-financeiro-biometric',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
