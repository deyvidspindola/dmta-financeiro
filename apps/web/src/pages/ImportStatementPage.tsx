import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { accountsApi, importsApi } from '@/api'
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
  StatementImportPreview,
  StatementImportPreviewRow,
  StatementImportSummary,
} from '@/types/models'

const i = strings.imports

const columns: ImportPreviewColumn<StatementImportPreviewRow>[] = [
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
      return previewMoney(
        row.parsed.amount,
        row.parsed.amount >= 0 ? 'credit' : 'debit',
      )
    },
  },
  {
    key: 'type',
    header: i.colType,
    cell: (row) =>
      row.parsed
        ? row.parsed.type === 'income'
          ? strings.quickAdd.income
          : strings.quickAdd.expense
        : '—',
  },
  {
    key: 'category',
    header: i.colCategory,
    cell: (row) => row.parsed?.category_name ?? '—',
  },
]

export function ImportStatementPage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = activeScope === CONSOLIDATED ? null : activeScope
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<StatementImportPreview | null>(null)
  const [summary, setSummary] = useState<StatementImportSummary | null>(null)

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId),
  })

  const templateMutation = useMutation({
    mutationFn: () =>
      importsApi.downloadStatementImportTemplate(contextId!, accountId),
  })

  const previewMutation = useMutation({
    mutationFn: (csv: File) =>
      importsApi.previewStatementCsv(contextId!, accountId, csv),
    onSuccess: (result) => {
      setPreview(result)
      setSummary(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: (lines: number[]) =>
      importsApi.importStatementCsv(contextId!, accountId, file!, lines),
    onSuccess: (result) => {
      setSummary(result)
      setPreview(null)
      toastSuccess(i.done)
    },
  })

  useEffect(() => {
    if (!contextId || !accountId || !file || summary) return
    previewMutation.mutate(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só quando arquivo/conta mudam
  }, [contextId, accountId, file])

  function resetForAnother(): void {
    setFile(null)
    setPreview(null)
    setSummary(null)
    previewMutation.reset()
    importMutation.reset()
  }

  const accounts = accountsQuery.data ?? []

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={i.statementTitle}
        description={i.statementHint}
        actions={
          <Button
            variant="ghost"
            onClick={() => templateMutation.mutate()}
            disabled={!contextId || !accountId || templateMutation.isPending}
          >
            {i.downloadTemplate}
          </Button>
        }
      />

      {!contextId ? <ErrorBanner message={i.needContext} /> : null}

      {!summary ? (
        <Card>
          <CardHeader title={i.instructions} description={i.statementHint} />
          <div className="space-y-4">
            <Field label={i.account}>
              <TextSelect
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value)
                  setPreview(null)
                }}
                disabled={!contextId}
              >
                <option value="">{strings.common.select}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
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
