/**
 * Entry point. Registra a task headless do listener de notificações
 * ANTES de carregar o router — ela precisa estar no AppRegistry mesmo
 * com o app fechado (o Android acorda o bundle JS só pra rodar essa
 * task quando chega uma notificação). Só depois delega pro entry padrão
 * do expo-router (por isso `require`, não `import`: garante a ordem).
 *
 * `AppRegistry.registerHeadlessTask` (usado por `registerHeadlessListener`)
 * não existe no shim do react-native-web — sem esse guard, o bundle web
 * quebra no import antes de montar qualquer tela.
 */
import { Platform } from 'react-native';
import { registerHeadlessListener } from 'expo-notification-listener';
import { handleCapturedNotification } from './src/lib/notificationCapture';

if (Platform.OS !== 'web') {
  registerHeadlessListener(handleCapturedNotification);
}

require('expo-router/entry');
