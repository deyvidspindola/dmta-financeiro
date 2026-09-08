import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Button, Screen, Text } from '@/components/ui';
import { t } from '@/i18n';

const APP_VERSION = Constants.expoConfig?.version ?? '—';

function formatDateTime(date?: Date): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-line py-3">
      <Text variant="muted" className="text-sm">
        {label}
      </Text>
      <Text className="text-sm" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function UpdatesScreen() {
  const router = useRouter();
  const { currentlyRunning, isUpdatePending } = Updates.useUpdates();

  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'checking' }
    | { kind: 'downloading' }
    | { kind: 'ready' }
    | { kind: 'uptodate' }
    | { kind: 'error'; message: string }
  >({ kind: isUpdatePending ? 'ready' : 'idle' });

  const check = useCallback(async () => {
    if (!Updates.isEnabled) return;
    try {
      setStatus({ kind: 'checking' });
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setStatus({ kind: 'uptodate' });
        return;
      }
      setStatus({ kind: 'downloading' });
      await Updates.fetchUpdateAsync();
      setStatus({ kind: 'ready' });
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const restart = useCallback(() => {
    void Updates.reloadAsync();
  }, []);

  const devBuild = !Updates.isEnabled;
  const source = currentlyRunning.isEmbeddedLaunch
    ? t.appUpdates.sourceEmbedded
    : t.appUpdates.sourceOta;

  return (
    <Screen scroll>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="title">{t.appUpdates.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>

      <View className="rounded-2xl border border-line bg-surface px-4">
        <Row label={t.appUpdates.appVersion} value={APP_VERSION} />
        <Row label={t.appUpdates.runtime} value={currentlyRunning.runtimeVersion ?? '—'} />
        <Row
          label={t.appUpdates.channel}
          value={currentlyRunning.channel ?? t.appUpdates.channelDev}
        />
        <Row label={t.appUpdates.source} value={source} />
        <Row label={t.appUpdates.lastUpdate} value={formatDateTime(currentlyRunning.createdAt)} />
        <View className="flex-row items-center justify-between gap-3 py-3">
          <Text variant="muted" className="text-sm">
            {t.appUpdates.updateId}
          </Text>
          <Text className="text-sm" numberOfLines={1}>
            {currentlyRunning.updateId ? currentlyRunning.updateId.slice(0, 8) : '—'}
          </Text>
        </View>
      </View>

      {devBuild ? (
        <View className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <Text className="font-medium">{t.appUpdates.devTitle}</Text>
          <Text variant="muted" className="mt-1 text-xs">
            {t.appUpdates.devHint}
          </Text>
        </View>
      ) : (
        <View className="mt-4 gap-3">
          {status.kind === 'ready' || isUpdatePending ? (
            <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
              <Text className="font-medium">{t.appUpdates.readyTitle}</Text>
              <Text variant="muted" className="text-xs">
                {t.appUpdates.readyHint}
              </Text>
              <Button label={t.appUpdates.restart} onPress={restart} />
            </View>
          ) : (
            <Button
              label={
                status.kind === 'checking'
                  ? t.appUpdates.checking
                  : status.kind === 'downloading'
                    ? t.appUpdates.downloading
                    : t.appUpdates.check
              }
              loading={status.kind === 'checking' || status.kind === 'downloading'}
              onPress={check}
            />
          )}

          {status.kind === 'uptodate' ? (
            <Text variant="muted" className="text-center text-sm">
              {t.appUpdates.upToDate}
            </Text>
          ) : null}
          {status.kind === 'error' ? (
            <View className="gap-1">
              <Text variant="error" className="text-center text-sm">
                {t.appUpdates.error}
              </Text>
              <Text variant="muted" className="text-center text-xs">
                {status.message}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
