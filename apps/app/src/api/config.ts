/**
 * Base da API. No Expo, variáveis públicas vêm de `EXPO_PUBLIC_*` (embutidas
 * no bundle em build/dev). Ver apps/app/README.md.
 *
 * Fallback = produção — assim um build/OTA sem a env explícita ainda loga
 * (o `.env` local sobrescreve pra apontar no Docker). Os perfis `preview` e
 * `production` do `eas.json` setam a env explicitamente.
 */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://financeiro.dmta.dev.br/api/v1'
).replace(/\/$/, '');

/** Nome do dispositivo enviado ao Sanctum em /auth/login e /auth/mfa/verify. */
export const DEVICE_NAME = 'app';
