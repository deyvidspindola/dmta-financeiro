import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api';
import { ApiError } from '@/api/http';
import { Button, Card, Screen, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess } from '@/store/toastStore';

type Step = 'warn' | 'password';

/**
 * Mais > Segurança — só tem o botão de apagar todos os dados (D-recente:
 * "começar do zero"), não o menu completo do Mobills. Dois passos: aviso
 * (o que é apagado, o que não é) e depois a senha atual, checada no
 * backend ({@see authApi.resetAccountData}).
 */
export default function SecurityScreen() {
  const router = useRouter();
  const sessionRoute = useSessionRoute();
  const queryClient = useQueryClient();
  const setContexts = useAuthStore((s) => s.setContexts);
  const setActiveScope = useAuthStore((s) => s.setActiveScope);
  const [step, setStep] = useState<Step>('warn');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = useMutation({
    mutationFn: (pwd: string) => authApi.resetAccountData(pwd),
    onSuccess: (context) => {
      // Todo o dado financeiro carregado até agora é lixo depois do reset —
      // limpa o cache inteiro em vez de invalidar query por query.
      queryClient.clear();
      setContexts([context]);
      setActiveScope(context.id);
      toastSuccess(t.security.resetSuccess);
      router.replace('/(tabs)');
    },
    onError: (err) =>
      setError(
        err instanceof ApiError && err.status === 422
          ? t.security.resetWrongPassword
          : t.common.error,
      ),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.security.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      <Card className="gap-4">
        <Text className="font-medium">{t.security.resetTitle}</Text>
        <Text variant="muted">{t.security.resetWarning}</Text>

        {step === 'warn' ? (
          <Button
            label={t.security.resetTitle}
            className="bg-negative active:bg-negative"
            onPress={() => setStep('password')}
          />
        ) : (
          <View className="gap-4">
            <TextField
              label={t.security.resetPasswordLabel}
              secureTextEntry
              autoFocus
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text variant="error">{error}</Text> : null}
            <Button
              label={t.security.resetConfirm}
              loading={reset.isPending}
              disabled={!password}
              className="bg-negative active:bg-negative"
              onPress={() => {
                setError(null);
                reset.mutate(password);
              }}
            />
          </View>
        )}
      </Card>
    </Screen>
  );
}
