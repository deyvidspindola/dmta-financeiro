import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapInvestment,
  toCreateInvestmentBody,
  toUpdateInvestmentBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Investment } from '@/types/models'

export type CreateInvestmentInput = Omit<Investment, 'id' | 'context_id'>

export type UpdateInvestmentInput = Omit<
  CreateInvestmentInput,
  'invested_amount'
>

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

export async function updateInvestment(
  contextId: string,
  investmentId: string,
  payload: UpdateInvestmentInput,
): Promise<Investment> {
  if (useMocks) {
    return mockApi.updateInvestment(contextId, investmentId, payload)
  }
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapInvestment>[1]
      | { data: Parameters<typeof mapInvestment>[1] }
    >(
      `/contexts/${contextId}/investments/${investmentId}`,
      toUpdateInvestmentBody(payload),
    ),
  )
  return mapInvestment(contextId, updated)
}

export async function deleteInvestment(
  contextId: string,
  investmentId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteInvestment(contextId, investmentId)
  await http.delete(`/contexts/${contextId}/investments/${investmentId}`)
}
