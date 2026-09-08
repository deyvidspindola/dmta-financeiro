import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { addNotificationPostedListener, getActiveNotifications } from 'expo-notification-listener';
import { notificationCapturesApi } from '@/api';
import { captureIfFinancial } from '@/lib/notificationCapture';
import { dropFromQueue, peekQueue } from '@/lib/notificationCaptureQueue';
import { notificationAccessGranted } from '@/lib/notificationPermission';
import { useAuthStore } from '@/store/authStore';

/**
 * Cola o listener de notificações (Android) ao ciclo de vida do app:
 *  - com o app aberto, escuta notificações e enfileira as financeiras;
 *  - ao abrir / voltar ao foco, **varre as notificações ativas** da barra
 *    (pega o que o evento em tempo real perdeu — app dormindo, evento
 *    engolido pelo SO) e **drena a fila local** pra API.
 *
 * A captura com o app fechado é feita pela task headless (ver `index.js`).
 * O drain não depende mais de `isPermissionGranted()` retornar `true` na
 * hora certa: se há item na fila, ele já veio do listener nativo (que só
 * entrega com permissão), então tenta enviar de qualquer jeito.
 */
export function useNotificationCaptureSync(): void {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const syncing = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !token) return;

    async function sweepActive() {
      if (!notificationAccessGranted()) return;
      try {
        const active = await getActiveNotifications();
        for (const n of active ?? []) {
          await captureIfFinancial({
            packageName: n.packageName,
            appName: n.appName,
            title: n.title,
            text: n.text,
            bigText: n.bigText,
            timestamp: n.timestamp,
          });
        }
      } catch {
        // serviço nativo ainda não ligado — tenta no próximo foco
      }
    }

    async function drain() {
      if (syncing.current) return;
      syncing.current = true;
      try {
        await sweepActive();
        const queued = await peekQueue();
        if (queued.length > 0) {
          await notificationCapturesApi.ingestCaptures(queued);
          await dropFromQueue(queued);
        }
        void queryClient.invalidateQueries({ queryKey: ['notification-captures'] });
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
