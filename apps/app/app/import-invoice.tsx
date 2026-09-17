import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Screen, SelectField, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { downloadAndShare } from '@/lib/download';
import { pickDocument } from '@/lib/pickDocument';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import * as importsApi from '@/api/imports';
import { listCreditCards } from '@/api/creditCards';
import type { CardInvoiceImportPreview, ImportPreviewStatus } from '@/types/models';

const STATUS_COLOR: Record<ImportPreviewStatus, string> = {
  ok: 'bg-positive text-white',
  duplicate: 'bg-amber-500 text-gray-900',
  invalid: 'bg-negative text-white',
};

export default function ImportInvoicePage() {
  const contextId = useAuthStore((s) => s.activeScope);
  const push = useToastStore((s) => s.push);
  const [cardId, setCardId] = useState<string | null>(null);
  const [file, setFile] = useState<importsApi.DocumentPickerAsset | null>(null);
  const [password, setPassword] = useState('');
  const [preview, setPreview] = useState<CardInvoiceImportPreview | null>(null);
  const [summary, setSummary] = useState<{ imported: number; failed: number } | null>(null);

  const cardsQuery = useQuery({
    queryKey: ['credit-cards', contextId],
    queryFn: () => listCreditCards(contextId!),
    enabled: !!contextId,
  });

  const cards = cardsQuery.data || [];
  const cardOptions = cards.map((card) => ({ value: card.id, label: card.name }));

  const handleDownloadTemplate = async () => {
    if (!contextId || !cardId) return;
    try {
      await downloadAndShare(
        await importsApi.downloadInvoiceTemplate(contextId, cardId),
        'modelo-importacao-fatura-cartao.csv',
      );
    } catch {
      push(t.imports.downloadTemplateError, 'error');
    }
  };

  // Preview
  const previewMutation = useMutation({
    mutationFn: async ({ f, pwd }: { f: importsApi.DocumentPickerAsset; pwd?: string }) => {
      if (!contextId || !cardId) throw new Error('no context or card');
      return importsApi.previewInvoice(contextId, cardId, f, pwd);
    },
    onSuccess: (data) => setPreview(data),
    onError: (error) =>
      push(error instanceof Error ? error.message : t.common.error, 'error', 8000),
  });

  // Import
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!contextId || !cardId || !file) throw new Error('no context, card or file');
      return importsApi.importInvoice(contextId, cardId, file, undefined, password || undefined);
    },
    onSuccess: (data) => {
      setSummary({ imported: data.imported, failed: data.failed.length });
      setPreview(null);
      setFile(null);
      setPassword('');
      push(t.imports.done);
    },
    onError: (error) =>
      push(error instanceof Error ? error.message : t.common.error, 'error', 8000),
  });

  const handlePickFile = async () => {
    try {
      const result = await pickDocument({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const f = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      };
      push(t.imports.fileSelected(asset.name));
      setFile(f);
      setPreview(null);
      setSummary(null);
      previewMutation.mutate({ f, pwd: password || undefined });
    } catch (error) {
      push(
        error instanceof Error
          ? `${t.imports.pickFileError} (${error.message})`
          : t.imports.pickFileError,
        'error',
        8000,
      );
    }
  };

  const handleRetryWithPassword = () => {
    if (!file) return;
    previewMutation.mutate({ f: file, pwd: password });
  };

  if (!contextId) {
    return (
      <Screen scroll className="py-4">
        <Text className="mb-4 text-2xl font-bold">{t.imports.cardInvoiceTitle}</Text>
        <Text variant="muted" className="text-center">
          {t.imports.needContext}
        </Text>
      </Screen>
    );
  }

  if (summary) {
    return (
      <Screen scroll className="py-4">
        <Text className="mb-4 text-2xl font-bold">{t.imports.cardInvoiceTitle}</Text>
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
              setCardId(null);
              setPassword('');
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll className="py-4">
      <Text className="mb-4 text-2xl font-bold">{t.imports.cardInvoiceTitle}</Text>
      <View className="gap-4">
        <Card className="gap-3">
          <Text variant="muted" className="text-sm leading-5">
            {t.imports.cardInvoiceDescription}
          </Text>

          {cardsQuery.isLoading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <SelectField
              label={t.imports.card}
              value={cardId}
              options={cardOptions}
              onChange={setCardId}
              placeholder={t.imports.selectCard}
            />
          )}

          {cardId && (
            <>
              <TextField
                label={t.imports.passwordLabel}
                value={password}
                onChangeText={setPassword}
                placeholder={t.imports.passwordPlaceholder}
                secureTextEntry
              />
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

        {preview?.needs_password && !previewMutation.isPending && (
          <Card className="gap-3">
            <Text className="font-semibold text-negative">{t.imports.needsPassword}</Text>
            <TextField
              label={t.imports.passwordLabelRequired}
              value={password}
              onChangeText={setPassword}
              placeholder={t.imports.passwordPlaceholder}
              secureTextEntry
            />
            <Button
              label={t.imports.retry}
              onPress={handleRetryWithPassword}
              loading={previewMutation.isPending}
            />
          </Card>
        )}

        {preview?.unsupported && !previewMutation.isPending && (
          <Card>
            <Text className="text-sm text-negative">{t.imports.unsupportedPdf}</Text>
          </Card>
        )}

        {preview && !preview.needs_password && !preview.unsupported && (
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
                      <View className="gap-0.5">
                        <Text variant="muted" className="text-xs" numberOfLines={1}>
                          {row.parsed.description} · R$ {row.parsed.amount.toFixed(2)}
                        </Text>
                        {row.parsed.installment_number && row.parsed.installment_total && (
                          <Text variant="muted" className="text-xs">
                            {t.imports.installment(
                              row.parsed.installment_number,
                              row.parsed.installment_total,
                            )}
                          </Text>
                        )}
                      </View>
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
