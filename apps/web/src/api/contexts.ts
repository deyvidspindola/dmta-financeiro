import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapContext, toCreateCompanyContextBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Context } from '@/types/models'

export type CreateCompanyContextInput = {
  name: string
  company_name: string
  company_document: string | null
}

export async function listContexts(): Promise<Context[]> {
  if (useMocks) return mockApi.listContexts()
  const payload = await http.get<
    | Array<Parameters<typeof mapContext>[0]>
    | { data: Array<Parameters<typeof mapContext>[0]> }
  >('/contexts')
  return unwrapData(payload).map(mapContext)
}

export async function createCompanyContext(
  payload: CreateCompanyContextInput,
): Promise<Context> {
  if (useMocks) return mockApi.createCompanyContext(payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapContext>[0]
      | { data: Parameters<typeof mapContext>[0] }
    >('/contexts', toCreateCompanyContextBody(payload)),
  )
  return mapContext(created)
}
