import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { Investment } from '@/types/models'

export type CreateInvestmentInput = Omit<Investment, 'id' | 'context_id'>

export async function listInvestments(
  contextId: string,
): Promise<Investment[]> {
  if (useMocks) return mockApi.listInvestments(contextId)
  return unwrapData(
    await http.get<Investment[] | { data: Investment[] }>(
      `/api/v1/contexts/${contextId}/investments`,
    ),
  )
}

export async function createInvestment(
  contextId: string,
  payload: CreateInvestmentInput,
): Promise<Investment> {
  if (useMocks) return mockApi.createInvestment(contextId, payload)
  return unwrapData(
    await http.post<Investment | { data: Investment }>(
      `/api/v1/contexts/${contextId}/investments`,
      payload,
    ),
  )
}
