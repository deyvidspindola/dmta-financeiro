import { Redirect } from 'expo-router';
import { useSessionRoute } from '@/hooks/useSessionRoute';

/** Entrada: manda a sessão pra onde ela deve estar (login / contexto / início). */
export default function Index() {
  return <Redirect href={useSessionRoute()} />;
}
