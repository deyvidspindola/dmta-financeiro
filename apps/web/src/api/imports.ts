import { useMocks } from '@/api/config'
import { http } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type {
  BillImportPreview,
  BillImportSummary,
  StatementImportPreview,
  StatementImportSummary,
} from '@/types/models'

function appendLines(body: FormData, lines?: number[]): void {
  if (!lines) return
  for (const line of lines) {
    body.append('lines[]', String(line))
  }
}

export async function downloadBillsImportTemplate(
  contextId: string,
): Promise<void> {
  if (useMocks) return mockApi.downloadBillsImportTemplate()
  await http.download(
    `/contexts/${contextId}/bills/import/template`,
    'modelo-importacao-boletos.csv',
  )
}

export async function previewBillsCsv(
  contextId: string,
  file: File,
): Promise<BillImportPreview> {
  if (useMocks) return mockApi.previewBillsCsv(file)
  const body = new FormData()
  body.append('file', file)
  return http.postForm<BillImportPreview>(
    `/contexts/${contextId}/bills/import/preview`,
    body,
  )
}

export async function importBillsCsv(
  contextId: string,
  file: File,
  lines?: number[],
): Promise<BillImportSummary> {
  if (useMocks) return mockApi.importBillsCsv(file, lines)
  const body = new FormData()
  body.append('file', file)
  appendLines(body, lines)
  return http.postForm<BillImportSummary>(
    `/contexts/${contextId}/bills/import`,
    body,
  )
}

export async function downloadStatementImportTemplate(
  contextId: string,
  accountId: string,
): Promise<void> {
  if (useMocks) return mockApi.downloadStatementImportTemplate()
  await http.download(
    `/contexts/${contextId}/accounts/${accountId}/statement-imports/template`,
    'modelo-importacao-extrato.csv',
  )
}

export async function previewStatementCsv(
  contextId: string,
  accountId: string,
  file: File,
): Promise<StatementImportPreview> {
  if (useMocks) return mockApi.previewStatementCsv(file)
  const body = new FormData()
  body.append('file', file)
  return http.postForm<StatementImportPreview>(
    `/contexts/${contextId}/accounts/${accountId}/statement-imports/preview`,
    body,
  )
}

export async function importStatementCsv(
  contextId: string,
  accountId: string,
  file: File,
  lines?: number[],
): Promise<StatementImportSummary> {
  if (useMocks) return mockApi.importStatementCsv(file, lines)
  const body = new FormData()
  body.append('file', file)
  appendLines(body, lines)
  return http.postForm<StatementImportSummary>(
    `/contexts/${contextId}/accounts/${accountId}/statement-imports`,
    body,
  )
}
