import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/store/secureToken';
import type { Context, User } from '@/types/models';

/**
 * Porte do apps/web/src/store/authStore.ts. Diferenças:
 *  - `persist` usa AsyncStorage (não localStorage)
 *  - o `token` NÃO é persistido pelo zustand — fica em memória e é
 *    espelhado no `expo-secure-store` (ver secureToken.ts). Hidrate no
 *    boot com `hydrateAuthToken()`.
 */
const CONSOLIDATED = 'consolidated' as const;

export type ActiveScope = string | typeof CONSOLIDATED;

interface AuthState {
  token: string | null;
  hydrated: boolean;
  user: User | null;
  contexts: Context[];
  activeScope: ActiveScope;
  /** O usuário já passou pelo seletor de contexto neste login? */
  scopeChosen: boolean;
  setSession: (payload: { token: string; user: User; contexts: Context[] }) => void;
  setUser: (user: User) => void;
  setContexts: (contexts: Context[]) => void;
  setActiveScope: (scope: ActiveScope) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      hydrated: false,
      user: null,
      contexts: [],
      activeScope: CONSOLIDATED,
      scopeChosen: false,
      setSession: ({ token, user, contexts }) => {
        void setStoredToken(token);
        set({ token, user, contexts, scopeChosen: false });
      },
      setUser: (user) => set({ user }),
      setContexts: (contexts) => set({ contexts }),
      setActiveScope: (activeScope) => set({ activeScope, scopeChosen: true }),
      clearSession: () => {
        void clearStoredToken();
        set({
          token: null,
          user: null,
          contexts: [],
          activeScope: CONSOLIDATED,
          scopeChosen: false,
        });
      },
    }),
    {
      name: 'dmta-financeiro-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        contexts: state.contexts,
        activeScope: state.activeScope,
        scopeChosen: state.scopeChosen,
      }),
    },
  ),
);

/** Lê o token do SecureStore e injeta no store. Chamar uma vez no boot. */
export async function hydrateAuthToken(): Promise<void> {
  const token = await getStoredToken();
  useAuthStore.setState({ token, hydrated: true });
}

export { CONSOLIDATED };
