import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { creditCardsApi } from '@/api'
import { CsvFileField, ImportResult } from '@/components/imports/ImportFields'
import {
  ImportPreviewTable,
  previewMoney,
  type ImportPreviewColumn,
} from '@/components/imports/ImportPreviewTable'
import {
  Button,
  Card,
  CardHeader,
  ErrorBanner,
  Field,
  PageHeader,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
import type {
  CardInvoiceImportPreview,
  CardInvoiceImportPreviewRow,
  CardInvoiceImportSummary,
} from '@/types/models'

const i = strings.imports

const columns: ImportPreviewColumn<CardInvoiceImportPreviewRow>[] = [
  {
    key: 'date',
    header: i.colDate,
    cell: (row) => row.parsed?.occurred_at ?? '—',
  },
  {
    key: 'description',
    header: i.colDescription,
    cell: (row) => row.parsed?.description ?? row.raw.descricao ?? '—',
  },
  {
    key: 'amount',
    header: i.colAmount,
    right: true,
    cell: (row) => {
      if (!row.parsed) return '—'
      return previewMoney(row.parsed.amount, 'debit')
    },
  },
  {
    key: 'category',
    header: i.colCategory,
    cell: (row) => row.parsed?.category_name ?? '—',
  },
]

export function ImportCardInvoicePage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = activeScope === CONSOLIDATED ? null : activeScope
  const [cardId, setCardId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CardInvoiceImportPreview | null>(null)
  const [summary, setSummary] = useState<CardInvoiceImportSummary | null>(null)

  const cardsQuery = useQuery({
    queryKey: ['credit-cards', contextId],
    queryFn: () => creditCardsApi.listCreditCards(contextId!),
    enabled: Boolean(contextId),
  })

  const templateMutation = useMutation({
    mutationFn: () =>
      creditCardsApi.downloadInvoiceTemplate(contextId!, cardId),
  })

  const previewMutation = useMutation({
    mutationFn: (csv: File) =>
      creditCardsApi.previewInvoiceCsv(contextId!, cardId, csv),
    onSuccess: (result) => {
      setPreview(result)
      setSummary(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: (lines: number[]) =>
      creditCardsApi.importInvoiceCsv(contextId!, cardId, file!, lines),
    onSuccess: (result) => {
      setSummary(result)
      setPreview(null)
      toastSuccess(i.done)
    },
  })

  useEffect(() => {
    if (!contextId || !cardId || !file || summary) return
    previewMutation.mutate(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só quando arquivo/cartão mudam
  }, [contextId, cardId, file])

  function resetForAnother(): void {
    setFile(null)
    setPreview(null)
    setSummary(null)
    previewMutation.reset()
    importMutation.reset()
  }

  const cards = cardsQuery.data ?? []

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={i.cardInvoiceTitle}
        description={i.cardInvoiceHint}
        actions={
          <Button
            variant="ghost"
            onClick={() => templateMutation.mutate()}
            disabled={!contextId || !cardId || templateMutation.isPending}
          >
            {i.downloadTemplate}
          </Button>
        }
      />

      {!contextId ? <ErrorBanner message={i.needContext} /> : null}

      {!summary ? (
        <Card>
          <CardHeader title={i.instructions} description={i.cardInvoiceHint} />
          <div className="space-y-4">
            <Field label={i.creditCard}>
              <TextSelect
                value={cardId}
                onChange={(event) => {
                  setCardId(event.target.value)
                  setPreview(null)
                }}
                disabled={!contextId}
              >
                <option value="">{strings.common.select}</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <CsvFileField
              file={file}
              onChange={(next) => {
                setFile(next)
                setPreview(null)
              }}
              disabled={!contextId}
            />
            {previewMutation.isPending ? (
              <p className="text-sm text-fg-muted">{i.loadingPreview}</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {previewMutation.isError ? (
        <ErrorBanner message={getErrorMessage(previewMutation.error)} />
      ) : null}
      {importMutation.isError ? (
        <ErrorBanner message={getErrorMessage(importMutation.error)} />
      ) : null}

      {preview && !summary ? (
        <Card>
          <CardHeader title={i.previewTitle} />
          <ImportPreviewTable
            rows={preview.rows}
            columns={columns}
            importing={importMutation.isPending}
            onImport={(lines) => importMutation.mutate(lines)}
          />
        </Card>
      ) : null}

      {summary ? (
        <div className="space-y-4">
          <ImportResult
            imported={summary.imported}
            duplicates={summary.duplicates}
            failed={summary.failed}
          />
          <Button variant="secondary" onClick={resetForAnother}>
            {i.importAnother}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
