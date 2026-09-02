import { useAuthStore } from '@/store/authStore';

export type SessionRoute = '/login' | '/select-context' | '/home';

/**
 * Rota onde a sessão atual deve estar. Usada pelo guard das telas do
 * Expo Router (redireciona pra cá quando a tela não corresponde ao estado).
 */
export function useSessionRoute(): SessionRoute {
  const token = useAuthStore((s) => s.token);
  const scopeChosen = useAuthStore((s) => s.scopeChosen);

  if (!token) return '/login';
  if (!scopeChosen) return '/select-context';
  return '/home';
}
