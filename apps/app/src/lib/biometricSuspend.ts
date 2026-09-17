let suspendUntil = 0;

/**
 * Suspende a trava biométrica (D-10) por um tempo — chame antes de abrir
 * qualquer UI do próprio sistema operacional que tira o foco do app sem
 * o usuário estar de fato saindo dele (seletor de arquivo, compartilhar,
 * câmera). Sem isso, `useBiometricLock` via `AppState` não distingue
 * essa troca de foco de um "usuário trocou de app" de verdade, e a
 * volta ao app reabre o prompt de biometria à toa.
 */
export function suspendBiometricLock(durationMs = 120_000): void {
  suspendUntil = Date.now() + durationMs;
}

export function isBiometricLockSuspended(): boolean {
  return Date.now() < suspendUntil;
}
