import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button, Logo, Screen, Text } from '@/components/ui';
import { t } from '@/i18n';

type Props = {
  onUnlock: () => void;
};

/**
 * Tela cheia mostrada por `useBiometricLock` enquanto `locked` — cobre o
 * conteúdo real (Stack) pra nada do dado financeiro aparecer antes da
 * biometria confirmar. `onUnlock` dispara o prompt de novo (o hook já
 * chama sozinho ao montar; o botão aqui é só pro caso do usuário cancelar
 * o prompt do sistema e precisar tentar de novo).
 */
export function BiometricLockScreen({ onUnlock }: Props) {
  return (
    <Screen center>
      <View className="items-center gap-4">
        <Logo size={64} />
        <Feather name="lock" size={32} color="#7c918b" />
        <View className="items-center gap-1">
          <Text variant="heading">{t.security.lockedTitle}</Text>
          <Text variant="muted" className="text-center">
            {t.security.lockedHint}
          </Text>
        </View>
        <Button label={t.security.unlock} onPress={onUnlock} className="mt-2 w-full" />
      </View>
    </Screen>
  );
}
