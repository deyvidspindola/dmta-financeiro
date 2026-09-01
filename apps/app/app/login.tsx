import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { z } from 'zod';
import { authApi, ApiError } from '@/api';
import { Button, Screen, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { isMfaChallenge } from '@/types/models';
import { useAuthStore } from '@/store/authStore';

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);

type Step = { name: 'credentials' } | { name: 'mfa'; mfaToken: string };

export default function LoginScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>({ name: 'credentials' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Redirect href="/" />;

  async function submitCredentials() {
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(t.auth.invalidCredentials);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await authApi.login(parsed.data);
      if (isMfaChallenge(result)) {
        setStep({ name: 'mfa', mfaToken: result.mfa_token });
        return;
      }
      setSession(result);
      router.replace('/select-context');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? t.auth.invalidCredentials
          : t.auth.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMfa() {
    if (step.name !== 'mfa') return;
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setError(t.auth.invalidMfa);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const session = await authApi.verifyMfa(step.mfaToken, parsed.data);
      setSession(session);
      router.replace('/select-context');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422 ? t.auth.invalidMfa : t.auth.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll center>
      <View className="gap-6">
        <View className="gap-1">
          <Text variant="heading">{t.appName}</Text>
          <Text variant="muted">{t.appTagline}</Text>
        </View>

        {step.name === 'credentials' ? (
          <View className="gap-4">
            <TextField
              label={t.auth.email}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
            <TextField
              label={t.auth.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            {error ? <Text variant="error">{error}</Text> : null}
            <Button label={t.auth.submit} loading={submitting} onPress={submitCredentials} />
          </View>
        ) : (
          <View className="gap-4">
            <Text variant="title">{t.auth.mfaTitle}</Text>
            <Text variant="muted">{t.auth.mfaHint}</Text>
            <TextField
              label={t.auth.mfaCode}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
            />
            {error ? <Text variant="error">{error}</Text> : null}
            <Button label={t.auth.mfaSubmit} loading={submitting} onPress={submitMfa} />
            <Button
              label={t.auth.mfaBack}
              variant="ghost"
              disabled={submitting}
              onPress={() => {
                setStep({ name: 'credentials' });
                setCode('');
                setError(null);
              }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
