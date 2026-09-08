/**
 * Estado da permissão "Acesso a notificações" (Android). O check nativo
 * (`isPermissionGranted`) lê `enabled_notification_listeners` das Settings
 * do sistema — é a fonte da verdade, mas volta `false` cedo demais se o
 * contexto nativo ainda não subiu, ou lança se o módulo não está no build
 * (Expo Go). Por isso todo acesso passa por aqui, com try/catch, e a UI
 * revê o valor sempre que o app volta ao foco (o usuário concede numa
 * tela de Settings fora do app).
 */

import { Platform } from 'react-native';
import { isPermissionGranted, requestPermission } from 'expo-notification-listener';

/** `true` só quando o Android confirma o acesso concedido. Nunca lança. */
export function notificationAccessGranted(): boolean {
  if (Platform.OS !== 'android') return false;

  try {
    return isPermissionGranted() === true;
  } catch {
    return false;
  }
}

/** Abre a tela de Settings de "Acesso a notificações". Nunca lança. */
export function openNotificationAccessSettings(): void {
  try {
    requestPermission();
  } catch {
    // módulo ausente (Expo Go) — nada a fazer
  }
}
