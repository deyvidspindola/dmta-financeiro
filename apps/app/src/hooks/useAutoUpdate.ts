import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';

/** Não checa mais que uma vez a cada 15 min. */
const MIN_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Puxa atualizações OTA (EAS Update) em segundo plano: no cold start o
 * próprio `expo-updates` já checa (política `ON_LOAD`) e aplica no
 * próximo lançamento; aqui cobrimos o caso do app que fica dias aberto —
 * ao voltar ao foco, baixa o update novo. Não reinicia sozinho (só marca
 * como pendente); o usuário reinicia na tela "Versão e atualizações" ou
 * no próximo cold start. Só roda em build com updates habilitado
 * (preview/produção), nunca em desenvolvimento.
 */
export function useAutoUpdate(): void {
  const lastCheck = useRef(0);

  useEffect(() => {
    if (!Updates.isEnabled) return;

    async function maybeFetch() {
      const now = Date.now();
      if (now - lastCheck.current < MIN_INTERVAL_MS) return;
      lastCheck.current = now;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // rede / runtime incompatível — tenta de novo no próximo foco
      }
    }

    void maybeFetch();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void maybeFetch();
    });

    return () => sub.remove();
  }, []);
}
