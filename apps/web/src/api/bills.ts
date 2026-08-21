import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { Bill } from '@/types/models'

export type CreateBillInput = Omit<Bill, 'id' | 'context_id' | 'origin'>

export async function listBills(contextId: string): Promise<Bill[]> {
  if (useMocks) return mockApi.listBills(contextId)
  return unwrapData(
    await http.get<Bill[] | { data: Bill[] }>(
      `/api/v1/contexts/${contextId}/bills`,
    ),
  )
}

export async function createBill(
  contextId: string,
  payload: CreateBillInput,
): Promise<Bill> {
  if (useMocks) return mockApi.createBill(contextId, payload)
  return unwrapData(
    await http.post<Bill | { data: Bill }>(
      `/api/v1/contexts/${contextId}/bills`,
      payload,
    ),
  )
}
