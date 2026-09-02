import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { accountsApi, importsApi } from '@/api'
import { CsvFileField, ImportResult } from '@/components/imports/ImportFields'
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
import type { StatementImportSummary } from '@/types/models'

const i = strings.imports

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
      toastSuccess(i.done)
    },
  })

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

      <Card>
        <CardHeader title={i.instructions} description={i.statementHint} />
        <div className="space-y-4">
          <Field label={i.account}>
            <TextSelect
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
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
            onChange={setFile}
            disabled={!contextId}
          />
          <Button
            onClick={() => file && importMutation.mutate(file)}
            disabled={!contextId || !accountId || !file || importMutation.isPending}
          >
            {i.upload}
          </Button>
        </div>
      </Card>

      {importMutation.isError ? (
        <ErrorBanner message={getErrorMessage(importMutation.error)} />
      ) : null}

      {summary ? (
        <ImportResult
          imported={summary.imported}
          duplicates={summary.duplicates}
          failed={summary.failed}
        />
      ) : null}
    </div>
  )
}
