import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { accountsApi, importsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
import {
  Button,
  ErrorBanner,
  Field,
  PageHeader,
  TextSelect,
} from '@/components/ui-legacy'
import type { StatementImportSummary } from '@/types/models'

export function ImportStatementPage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = activeScope === CONSOLIDATED ? null : activeScope
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
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

  const importMutation = useMutation({
    mutationFn: (csv: File) =>
      importsApi.importStatementCsv(contextId!, accountId, csv),
    onSuccess: (result) => {
      setSummary(result)
      toastSuccess(strings.imports.done)
    },
  })

  const accounts = accountsQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.imports.statementTitle}
        description={strings.imports.statementHint}
        actions={
          <Button
            variant="ghost"
            onClick={() => templateMutation.mutate()}
            disabled={!contextId || !accountId || templateMutation.isPending}
          >
            {strings.imports.downloadTemplate}
          </Button>
        }
      />

      {!contextId ? (
        <ErrorBanner message={strings.imports.needContext} />
      ) : null}

      <Field label={strings.imports.account}>
        <TextSelect
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
        >
          <option value="">{strings.common.select}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label={strings.imports.file}>
        <input
          className="input"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </Field>
      <Button
        onClick={() => file && importMutation.mutate(file)}
        disabled={!contextId || !accountId || !file || importMutation.isPending}
      >
        {strings.imports.upload}
      </Button>
      {importMutation.isError ? (
        <ErrorBanner message={getErrorMessage(importMutation.error)} />
      ) : null}
      {summary ? (
        <div className="success-banner">
          <p>
            {strings.imports.imported}: {summary.imported} ·{' '}
            {strings.imports.duplicates}: {summary.duplicates} ·{' '}
            {strings.imports.failed}: {summary.failed.length}
          </p>
          {summary.failed.length > 0 ? (
            <ul>
              {summary.failed.map((row) => (
                <li key={`${row.row}-${row.reason}`}>
                  {strings.imports.failedRow} {row.row}: {row.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
