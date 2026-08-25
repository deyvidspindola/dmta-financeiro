import { useMocks } from '@/api/config'
import { http } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { BillImportSummary, StatementImportSummary } from '@/types/models'

export async function downloadBillsImportTemplate(
  contextId: string,
): Promise<void> {
  if (useMocks) return mockApi.downloadBillsImportTemplate()
  await http.download(
    `/contexts/${contextId}/bills/import/template`,
    'modelo-importacao-boletos.csv',
  )
}

export async function importBillsCsv(
  contextId: string,
  file: File,
): Promise<BillImportSummary> {
  if (useMocks) return mockApi.importBillsCsv(file)
  const body = new FormData()
  body.append('file', file)
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

export async function importStatementCsv(
  contextId: string,
  accountId: string,
  file: File,
): Promise<StatementImportSummary> {
  if (useMocks) return mockApi.importStatementCsv(file)
  const body = new FormData()
  body.append('file', file)
  return http.postForm<StatementImportSummary>(
    `/contexts/${contextId}/accounts/${accountId}/statement-imports`,
    body,
  )
}
