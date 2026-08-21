import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapInvestment, toCreateInvestmentBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Investment } from '@/types/models'

export type CreateInvestmentInput = Omit<Investment, 'id' | 'context_id'>

export async function listInvestments(
  contextId: string,
): Promise<Investment[]> {
  if (useMocks) return mockApi.listInvestments(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapInvestment>[1]>
    | { data: Array<Parameters<typeof mapInvestment>[1]> }
  >(`/contexts/${contextId}/investments`)
  return unwrapData(payload).map((row) => mapInvestment(contextId, row))
}

export async function createInvestment(
  contextId: string,
  payload: CreateInvestmentInput,
): Promise<Investment> {
  if (useMocks) return mockApi.createInvestment(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapInvestment>[1]
      | { data: Parameters<typeof mapInvestment>[1] }
    >(
      `/contexts/${contextId}/investments`,
      toCreateInvestmentBody(payload),
    ),
  )
  return mapInvestment(contextId, created)
}
