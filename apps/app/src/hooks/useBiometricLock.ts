import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { isBiometricLockSuspended } from '@/lib/biometricSuspend';
import { useBiometricStore } from '@/store/biometricStore';
import { t } from '@/i18n';

/**
 * Trava o app com biometria (D-10) quando há sessão ativa: bloqueia no
 * cold start e sempre que o app volta de segundo plano — não só "no
 * primeiro acesso", porque o processo raramente morre entre um uso e
 * outro (o valor de segurança está em travar ao reabrir, não só ao
 * logar). Web nunca trava (`expo-local-authentication` não roda lá,
 * e é o mesmo alvo do `apps/web`, sem esse gate). Se o aparelho não tem
 * biometria cadastrada, também não trava — sem isso o usuário ficava
 * preso sem forma de entrar. Ignora a transição de `AppState` enquanto
 * {@see isBiometricLockSuspended} — sem isso, abrir um seletor de
 * arquivo do próprio SO já contava como "saiu do app".
 */
export function useBiometricLock(hasSession: boolean): {
  locked: boolean;
  unlock: () => void;
} {
  const enabled = useBiometricStore((s) => s.enabled);
  const shouldLock = hasSession && enabled && Platform.OS !== 'web';

  const [awaitingAuth, setAwaitingAuth] = useState(shouldLock);
  const authenticating = useRef(false);

  // Rearma `awaitingAuth` quando o gate liga/desliga (ex.: logout e login
  // de novo) — ajuste síncrono durante a renderização, não num efeito, é
  // o jeito que o React recomenda pra "resetar estado quando uma prop
  // muda" sem disparar `set-state-in-effect`.
  const [trackedShouldLock, setTrackedShouldLock] = useState(shouldLock);
  if (shouldLock !== trackedShouldLock) {
    setTrackedShouldLock(shouldLock);
    setAwaitingAuth(shouldLock);
  }

  const attemptUnlock = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    try {
      const [hardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!hardware || !enrolled) {
        setAwaitingAuth(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.security.biometricPrompt,
        cancelLabel: t.common.cancel,
        disableDeviceFallback: false,
      });
      if (result.success) setAwaitingAuth(false);
    } finally {
      authenticating.current = false;
    }
  }, []);

  useEffect(() => {
    if (!shouldLock) return;

    void attemptUnlock();

    const sub = AppState.addEventListener('change', (state) => {
      // Seletor de arquivo, compartilhar, câmera: o app perde foco pro
      // SO sem o usuário ter saído de fato — ver `suspendBiometricLock`.
      if (isBiometricLockSuspended()) return;

      if (state === 'active') {
        setAwaitingAuth(true);
        void attemptUnlock();
      } else if (state === 'background') {
        setAwaitingAuth(true);
      }
    });

    return () => sub.remove();
  }, [shouldLock, attemptUnlock]);

  return { locked: shouldLock && awaitingAuth, unlock: () => void attemptUnlock() };
}
