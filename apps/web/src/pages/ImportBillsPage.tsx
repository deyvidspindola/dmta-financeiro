import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { importsApi } from '@/api'
import { CsvFileField, ImportResult } from '@/components/imports/ImportFields'
import { ImportTabs } from '@/components/imports/ImportTabs'
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
  PageHeader,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
import type {
  BillImportPreview,
  BillImportPreviewRow,
  BillImportSummary,
} from '@/types/models'

const i = strings.imports

const columns: ImportPreviewColumn<BillImportPreviewRow>[] = [
  {
    key: 'due',
    header: i.colDueDate,
    cell: (row) => row.parsed?.due_date ?? '—',
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
      return previewMoney(
        row.parsed.amount,
        row.parsed.direction === 'receivable' ? 'credit' : 'debit',
      )
    },
  },
  {
    key: 'direction',
    header: i.colDirection,
    cell: (row) =>
      row.parsed
        ? strings.bills.kinds[row.parsed.direction]
        : '—',
  },
  {
    key: 'category',
    header: i.colCategory,
    cell: (row) => row.parsed?.category_name ?? '—',
  },
  {
    key: 'beneficiary',
    header: i.colBeneficiary,
    cell: (row) => row.parsed?.beneficiary ?? '—',
  },
]

export function ImportBillsPage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = activeScope === CONSOLIDATED ? null : activeScope
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<BillImportPreview | null>(null)
  const [summary, setSummary] = useState<BillImportSummary | null>(null)

  const templateMutation = useMutation({
    mutationFn: () => importsApi.downloadBillsImportTemplate(contextId!),
    onError: () => undefined,
  })

  const previewMutation = useMutation({
    mutationFn: (csv: File) => importsApi.previewBillsCsv(contextId!, csv),
    onSuccess: (result) => {
      setPreview(result)
      setSummary(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: (lines: number[]) =>
      importsApi.importBillsCsv(contextId!, file!, lines),
    onSuccess: (result) => {
      setSummary(result)
      setPreview(null)
      toastSuccess(i.done)
    },
  })

  useEffect(() => {
    if (!contextId || !file || summary) return
    previewMutation.mutate(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só quando o arquivo muda
  }, [contextId, file])

  function resetForAnother(): void {
    setFile(null)
    setPreview(null)
    setSummary(null)
    previewMutation.reset()
    importMutation.reset()
  }

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={i.billsTitle}
        description={i.billsHint}
        actions={
          <Button
            variant="ghost"
            onClick={() => templateMutation.mutate()}
            disabled={!contextId || templateMutation.isPending}
          >
            {i.downloadTemplate}
          </Button>
        }
      />

      <ImportTabs active="bills" />

      {!contextId ? <ErrorBanner message={i.needContext} /> : null}

      {!summary ? (
        <Card>
          <CardHeader title={i.instructions} description={i.billsHint} />
          <div className="space-y-4">
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
