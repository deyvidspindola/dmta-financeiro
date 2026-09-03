import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { addNotificationPostedListener, isPermissionGranted } from 'expo-notification-listener';
import { notificationCapturesApi } from '@/api';
import { captureIfFinancial } from '@/lib/notificationCapture';
import { dropFromQueue, peekQueue } from '@/lib/notificationCaptureQueue';
import { useAuthStore } from '@/store/authStore';

/**
 * Cola o listener de notificações (Android) ao ciclo de vida do app:
 *  - com o app aberto, escuta notificações e enfileira as financeiras;
 *  - ao abrir / voltar ao foco, drena a fila local pra API e atualiza a
 *    inbox.
 * A captura com o app fechado é feita pela task headless (ver `index.js`)
 * — aqui só cuidamos do foreground e da sincronização.
 */
export function useNotificationCaptureSync(): void {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const syncing = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !token) return;

    async function drain() {
      if (syncing.current || !isPermissionGranted()) return;
      syncing.current = true;
      try {
        const queued = await peekQueue();
        if (queued.length > 0) {
          await notificationCapturesApi.ingestCaptures(queued);
          await dropFromQueue(queued);
          void queryClient.invalidateQueries({ queryKey: ['notification-captures'] });
        }
      } catch {
        // rede/sessão — tenta de novo no próximo foco
      } finally {
        syncing.current = false;
      }
    }

    const sub = addNotificationPostedListener((n) => {
      void captureIfFinancial({
        packageName: n.packageName,
        appName: n.appName,
        title: n.title,
        text: n.text,
        bigText: n.bigText,
        timestamp: n.timestamp,
      }).then((added) => {
        if (added) void drain();
      });
    });

    void drain();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void drain();
    });

    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [token, queryClient]);
}
