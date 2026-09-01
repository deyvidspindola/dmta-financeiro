import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { importsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
import {
  Button,
  ErrorBanner,
  Field,
  PageHeader,
} from '@/components/ui-legacy'
import type { BillImportSummary } from '@/types/models'

export function ImportBillsPage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = activeScope === CONSOLIDATED ? null : activeScope
  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState<BillImportSummary | null>(null)

  const templateMutation = useMutation({
    mutationFn: () => importsApi.downloadBillsImportTemplate(contextId!),
    onError: () => undefined,
  })

  const importMutation = useMutation({
    mutationFn: (csv: File) => importsApi.importBillsCsv(contextId!, csv),
    onSuccess: (result) => {
      setSummary(result)
      toastSuccess(strings.imports.done)
    },
  })

  return (
    <div className="stack">
      <PageHeader
        title={strings.imports.billsTitle}
        description={strings.imports.billsHint}
        actions={
          <Button
            variant="ghost"
            onClick={() => templateMutation.mutate()}
            disabled={!contextId || templateMutation.isPending}
          >
            {strings.imports.downloadTemplate}
          </Button>
        }
      />

      {!contextId ? (
        <ErrorBanner message={strings.imports.needContext} />
      ) : null}

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
        disabled={!contextId || !file || importMutation.isPending}
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
