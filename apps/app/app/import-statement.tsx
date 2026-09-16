import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AccountIcon, Badge, Button, Card, Screen, SelectField, Text } from '@/components/ui';
import { t } from '@/i18n';
import { downloadAndShare } from '@/lib/download';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import * as importsApi from '@/api/imports';
import { listAccounts } from '@/api/accounts';
import type { ImportPreviewStatus, StatementImportPreview } from '@/types/models';

const STATUS_COLOR: Record<ImportPreviewStatus, string> = {
  ok: 'bg-positive text-white',
  duplicate: 'bg-amber-500 text-gray-900',
  invalid: 'bg-negative text-white',
};

export default function ImportStatementPage() {
  const contextId = useAuthStore((s) => s.activeScope);
  const push = useToastStore((s) => s.push);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [file, setFile] = useState<importsApi.DocumentPickerAsset | null>(null);
  const [preview, setPreview] = useState<StatementImportPreview | null>(null);
  const [summary, setSummary] = useState<{ imported: number; failed: number } | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => listAccounts(contextId!),
    enabled: !!contextId,
  });

  const accounts = accountsQuery.data || [];
  const accountOptions = accounts.map((acc) => ({ value: acc.id, label: acc.name }));

  const handleDownloadTemplate = async () => {
    if (!contextId || !accountId) return;
    try {
      await downloadAndShare(
        await importsApi.downloadStatementImportTemplate(contextId, accountId),
        'modelo-importacao-extrato.csv',
      );
    } catch {
      push(t.imports.downloadTemplateError, 'error');
    }
  };

  // Preview
  const previewMutation = useMutation({
    mutationFn: async (f: importsApi.DocumentPickerAsset) => {
      if (!contextId || !accountId) throw new Error('no context or account');
      return importsApi.previewStatementCsv(contextId, accountId, f);
    },
    onSuccess: (data) => setPreview(data),
    onError: () => push(t.common.error, 'error'),
  });

  // Import
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!contextId || !accountId || !file) throw new Error('no context, account or file');
      return importsApi.importStatementCsv(contextId, accountId, file);
    },
    onSuccess: (data) => {
      setSummary({ imported: data.imported, failed: data.failed.length });
      setPreview(null);
      setFile(null);
      push(t.imports.done);
    },
    onError: () => push(t.common.error, 'error'),
  });

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'text/csv',
      size: asset.size,
    });
    setPreview(null);
    setSummary(null);
    previewMutation.mutate({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'text/csv',
      size: asset.size,
    });
  };

  if (!contextId) {
    return (
      <Screen scroll className="py-4">
        <Text className="mb-4 text-2xl font-bold">{t.imports.statementTitle}</Text>
        <Text variant="muted" className="text-center">
          {t.imports.needContext}
        </Text>
      </Screen>
    );
  }

  if (summary) {
    return (
      <Screen scroll className="py-4">
        <Text className="mb-4 text-2xl font-bold">{t.imports.statementTitle}</Text>
        <Card className="gap-3">
          <Text className="text-lg font-semibold">{t.imports.summary}</Text>
          <View className="gap-2">
            <Text>
              {t.imports.imported}: <Text className="font-semibold">{summary.imported}</Text>
            </Text>
            <Text>
              {t.imports.failed}: <Text className="font-semibold">{summary.failed}</Text>
            </Text>
          </View>
          <Button
            label={t.imports.importAnother}
            onPress={() => {
              setSummary(null);
              setAccountId(null);
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll className="py-4">
      <Text className="mb-4 text-2xl font-bold">{t.imports.statementTitle}</Text>
      <View className="gap-4">
        <Card className="gap-3">
          <Text variant="muted" className="text-sm leading-5">
            {t.imports.statementDescription}
          </Text>

          {accountsQuery.isLoading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <SelectField
              label={t.imports.account}
              value={accountId}
              options={accountOptions}
              onChange={setAccountId}
              placeholder={t.imports.selectAccount}
              renderIcon={(opt) => {
                const acc = accounts.find((a) => a.id === opt.value);
                return acc ? <AccountIcon type={acc.type} /> : null;
              }}
            />
          )}

          {accountId && (
            <>
              <Button
                label={t.imports.downloadTemplate}
                variant="secondary"
                onPress={handleDownloadTemplate}
              />
              <Button label={t.imports.uploadFile} onPress={handlePickFile} />
            </>
          )}
        </Card>

        {previewMutation.isPending && (
          <Card className="items-center gap-2 py-6">
            <ActivityIndicator size="large" color="#10b981" />
            <Text variant="muted">{t.imports.loadingPreview}</Text>
          </Card>
        )}

        {preview && (
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold">{t.imports.previewTitle}</Text>
              <Badge tone="brand">{preview.summary.ok} OK</Badge>
            </View>

            <View className="gap-2 rounded-lg border border-line bg-canvas p-3">
              <View className="flex-row gap-2">
                <Text variant="muted" className="text-xs">
                  {t.imports.total}: {preview.summary.total}
                </Text>
                <Text variant="muted" className="text-xs">
                  · {t.imports.rowStatus.ok}: {preview.summary.ok}
                </Text>
                <Text variant="muted" className="text-xs">
                  · {t.imports.duplicates}: {preview.summary.duplicates}
                </Text>
                <Text variant="muted" className="text-xs">
                  · {t.imports.invalidCount}: {preview.summary.invalid}
                </Text>
              </View>
            </View>

            <ScrollView className="max-h-80">
              <View className="gap-2">
                {preview.rows.slice(0, 20).map((row) => (
                  <View
                    key={row.line}
                    className="gap-1 rounded-lg border border-line bg-canvas p-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-medium">
                        {t.imports.failedRow} {row.line}
                      </Text>
                      <View
                        className={`rounded px-2 py-0.5 ${STATUS_COLOR[row.status] || 'bg-gray-500'}`}
                      >
                        <Text className="text-xs font-medium text-white">
                          {t.imports.rowStatus[row.status]}
                        </Text>
                      </View>
                    </View>
                    {row.parsed && (
                      <Text variant="muted" className="text-xs" numberOfLines={1}>
                        {row.parsed.description} · R$ {row.parsed.amount.toFixed(2)} ·{' '}
                        {row.parsed.type === 'income'
                          ? t.imports.entryTypeIncome
                          : t.imports.entryTypeExpense}
                      </Text>
                    )}
                    {row.reason && <Text className="text-xs text-negative">{row.reason}</Text>}
                  </View>
                ))}
                {preview.rows.length > 20 && (
                  <Text variant="muted" className="text-center text-xs">
                    + {preview.rows.length - 20} linhas…
                  </Text>
                )}
              </View>
            </ScrollView>

            <Button
              label={t.imports.importSelected}
              onPress={() => importMutation.mutate()}
              loading={importMutation.isPending}
              disabled={preview.summary.ok === 0}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}
