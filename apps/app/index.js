/**
 * Entry point. Registra a task headless do listener de notificações
 * ANTES de carregar o router — ela precisa estar no AppRegistry mesmo
 * com o app fechado (o Android acorda o bundle JS só pra rodar essa
 * task quando chega uma notificação). Só depois delega pro entry padrão
 * do expo-router (por isso `require`, não `import`: garante a ordem).
 */
import { registerHeadlessListener } from 'expo-notification-listener';
import { handleCapturedNotification } from './src/lib/notificationCapture';

registerHeadlessListener(handleCapturedNotification);

require('expo-router/entry');
