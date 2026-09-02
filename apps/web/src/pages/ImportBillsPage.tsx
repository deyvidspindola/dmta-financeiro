import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { importsApi } from '@/api'
import { CsvFileField, ImportResult } from '@/components/imports/ImportFields'
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
import type { BillImportSummary } from '@/types/models'

const i = strings.imports

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
      toastSuccess(i.done)
    },
  })

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

      {!contextId ? <ErrorBanner message={i.needContext} /> : null}

      <Card>
        <CardHeader title={i.instructions} description={i.billsHint} />
        <div className="space-y-4">
          <CsvFileField
            file={file}
            onChange={setFile}
            disabled={!contextId}
          />
          <Button
            onClick={() => file && importMutation.mutate(file)}
            disabled={!contextId || !file || importMutation.isPending}
          >
            {i.upload}
          </Button>
        </div>
      </Card>

      {importMutation.isError ? (
        <ErrorBanner message={getErrorMessage(importMutation.error)} />
      ) : null}

      {summary ? (
        <ImportResult imported={summary.imported} failed={summary.failed} />
      ) : null}
    </div>
  )
}
