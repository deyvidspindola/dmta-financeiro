import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api';
import { ApiError } from '@/api/http';
import { Button, Sheet, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess } from '@/store/toastStore';

type Step = 'warn' | 'password';

/**
 * Menu de segurança aberto pelo leque do "+" — só tem o botão de apagar
 * todos os dados (D-recente: "começar do zero"), não o menu completo do
 * Mobills. Dois passos: aviso (o que é apagado, o que não é) e depois a
 * senha atual, checada no backend ({@see authApi.resetAccountData}).
 */
export function SecuritySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const setContexts = useAuthStore((s) => s.setContexts);
  const setActiveScope = useAuthStore((s) => s.setActiveScope);
  const [step, setStep] = useState<Step>('warn');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    onClose();
    setStep('warn');
    setPassword('');
    setError(null);
  };

  const reset = useMutation({
    mutationFn: (pwd: string) => authApi.resetAccountData(pwd),
    onSuccess: (context) => {
      // Todo o dado financeiro carregado até agora é lixo depois do reset —
      // limpa o cache inteiro em vez de invalidar query por query.
      queryClient.clear();
      setContexts([context]);
      setActiveScope(context.id);
      toastSuccess(t.security.resetSuccess);
      close();
    },
    onError: (err) =>
      setError(
        err instanceof ApiError && err.status === 422
          ? t.security.resetWrongPassword
          : t.common.error,
      ),
  });

  return (
    <Sheet open={open} onClose={close} title={t.security.title}>
      {step === 'warn' ? (
        <View className="gap-4">
          <Text variant="muted">{t.security.resetWarning}</Text>
          <Button
            label={t.security.resetTitle}
            className="bg-negative active:bg-negative"
            onPress={() => setStep('password')}
          />
        </View>
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
    </Sheet>
  );
}
